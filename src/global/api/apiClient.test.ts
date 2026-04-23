import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from './apiClient';
import { ApiError } from '@/global/error/ApiError';
import { useAuthStore } from '@/global/store/authStore';

type MockResponseInit = {
  status?: number;
  body?: unknown;
  ok?: boolean;
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

describe('apiClient (basic)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    useAuthStore.setState({ accessToken: null });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('ApiResponse 성공 응답을 언래핑하여 data만 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 200,
        body: {
          success: true,
          message: null,
          data: { id: 1, name: '밴드A' },
          timestamp: '2026-04-23T00:00:00Z',
        },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiClient.get<{ id: number; name: string }>('/api/v1/bands/1');

    expect(result).toEqual({ id: 1, name: '밴드A' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('accessToken 이 있으면 Authorization 헤더를 주입한다', async () => {
    useAuthStore.setState({ accessToken: 'tk_abc' });
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 200,
        body: { success: true, message: null, data: null, timestamp: 't' },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiClient.post('/api/v1/bands', { name: '밴드X' });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers.Authorization).toBe('Bearer tk_abc');
    expect(init.body).toBe(JSON.stringify({ name: '밴드X' }));
  });

  it('query 옵션을 URLSearchParams 로 직렬화한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 200,
        body: { success: true, message: null, data: [], timestamp: 't' },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiClient.get('/api/v1/bands', {
      query: { page: 1, size: 20, keyword: '밴', empty: undefined, nil: null },
    });

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/bands\?/);
    expect(url).toContain('page=1');
    expect(url).toContain('size=20');
    expect(url).toContain('keyword=');
    expect(url).not.toContain('empty=');
    expect(url).not.toContain('nil=');
  });

  it('HTTP 에러 응답은 ApiError로 throw 된다 (code/fieldErrors 포함)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 400,
        statusText: 'Bad Request',
        body: {
          success: false,
          message: '유효성 검증 실패',
          data: null,
          timestamp: 't',
          code: 'VALIDATION_FAILED',
          fieldErrors: { email: '이메일 형식' },
        },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.post('/api/v1/members/join', {})).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_FAILED',
      status: 400,
      message: '유효성 검증 실패',
      fieldErrors: { email: '이메일 형식' },
    });
  });

  it('네트워크 장애 시 code=NETWORK_ERROR 로 ApiError throw', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network down'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const err = await apiClient.get('/api/v1/bands').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('NETWORK_ERROR');
    expect((err as ApiError).status).toBe(0);
  });

  it('응답 바디 success=false 인 2xx 응답도 ApiError 로 변환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 200,
        body: {
          success: false,
          message: '처리 불가',
          data: null,
          timestamp: 't',
          code: 'BUSINESS_RULE_VIOLATION',
        },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/api/v1/bands/1')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'BUSINESS_RULE_VIOLATION',
      message: '처리 불가',
    });
  });
});
