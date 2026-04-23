import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, setUnauthorizedHandler } from './apiClient';
import { ApiError } from '@/global/error/ApiError';
import { useAuthStore } from '@/global/store/authStore';

type MockResponseInit = {
  status?: number;
  body?: unknown;
  statusText?: string;
};

function mockResponse({ status = 200, body, statusText = 'OK' }: MockResponseInit = {}) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText,
    text: async () => text,
  } as Response;
}

function apiResponse<T>(data: T) {
  return {
    success: true,
    message: null,
    data,
    timestamp: '2026-04-23T00:00:00Z',
  };
}

describe('apiClient 401 interceptor', () => {
  const originalFetch = globalThis.fetch;
  const unauthorized = vi.fn();

  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'old_token' });
    unauthorized.mockReset();
    setUnauthorizedHandler(unauthorized);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('401 수신 시 /auth/refresh 호출 후 새 토큰으로 원래 요청을 재시도한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(
        mockResponse({ status: 200, body: apiResponse({ accessToken: 'new_token' }) }),
      )
      .mockResolvedValueOnce(mockResponse({ status: 200, body: apiResponse({ id: 1 }) }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiClient.get<{ id: number }>('/api/v1/bands/1');

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [firstCall, refreshCall, retryCall] = fetchMock.mock.calls;
    expect(firstCall![0]).toContain('/api/v1/bands/1');
    expect(firstCall![1].headers.Authorization).toBe('Bearer old_token');

    expect(refreshCall![0]).toContain('/api/v1/auth/refresh');
    expect(refreshCall![1].method).toBe('POST');
    expect(refreshCall![1].headers.Authorization).toBeUndefined();

    expect(retryCall![0]).toContain('/api/v1/bands/1');
    expect(retryCall![1].headers.Authorization).toBe('Bearer new_token');

    expect(useAuthStore.getState().accessToken).toBe('new_token');
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('refresh 실패 시 authStore 를 비우고 unauthorized handler 를 호출한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ status: 401 }))
      .mockResolvedValueOnce(
        mockResponse({
          status: 401,
          body: { success: false, message: 'refresh expired', data: null, timestamp: 't' },
        }),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const err = await apiClient.get('/api/v1/bands').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('UNAUTHORIZED');
    expect((err as ApiError).status).toBe(401);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(unauthorized).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('/auth/refresh 자체 호출은 401 인터셉터를 재귀 트리거하지 않는다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ status: 401 }))
      .mockResolvedValueOnce(mockResponse({ status: 401 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiClient.get('/api/v1/bands').catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('동시에 발생한 401 은 한 번만 refresh 를 호출한다', async () => {
    let resolveRefresh: ((r: Response) => void) | undefined;
    const refreshHold = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({ status: 401 }))
      .mockResolvedValueOnce(mockResponse({ status: 401 }))
      .mockImplementationOnce(() => refreshHold)
      .mockResolvedValueOnce(mockResponse({ status: 200, body: apiResponse({ id: 'a' }) }))
      .mockResolvedValueOnce(mockResponse({ status: 200, body: apiResponse({ id: 'b' }) }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const p1 = apiClient.get<{ id: string }>('/api/v1/a');
    const p2 = apiClient.get<{ id: string }>('/api/v1/b');

    await Promise.resolve();
    await Promise.resolve();

    resolveRefresh!(mockResponse({ status: 200, body: apiResponse({ accessToken: 'new_token' }) }));

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ id: 'a' });
    expect(r2).toEqual({ id: 'b' });

    const refreshCalls = fetchMock.mock.calls.filter((c) => c[0].includes('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(useAuthStore.getState().accessToken).toBe('new_token');
  });
});
