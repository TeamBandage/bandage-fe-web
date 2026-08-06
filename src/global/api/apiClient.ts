import { env } from '@/global/config/env';
import { ROUTES } from '@/global/config/routes';
import { ApiError, type ApiErrorFieldErrors } from '@/global/error/ApiError';
import { useAuthStore } from '@/global/store/authStore';
import type { ApiResponse } from '@/global/types/api';

type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number>;

export type RequestConfig = {
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Internal: skip the 401 interceptor for this request (refresh call itself). */
  _skipAuthRefresh?: boolean;
  /** Internal: skip auth header injection. */
  _skipAuthHeader?: boolean;
};

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type ErrorPayload = Partial<ApiResponse<unknown>> & {
  code?: string;
  fieldErrors?: ApiErrorFieldErrors;
};

const REFRESH_PATH = '/api/v1/auth/refresh';

let unauthorizedHandler: () => void = () => {
  if (typeof window !== 'undefined') {
    window.location.assign(ROUTES.LOGIN);
  }
};

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function triggerUnauthorized() {
  unauthorizedHandler();
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(path, env.NEXT_PUBLIC_API_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      // 배열은 반복 키(Spring List<T> 기본 바인딩 규약)로 직렬화: status=A&status=B
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('PARSE_ERROR', 'Failed to parse response body', response.status);
  }
}

function toApiError(payload: unknown, status: number, fallbackMessage: string): ApiError {
  const data = (payload ?? {}) as ErrorPayload;
  return new ApiError(
    data.code ?? 'UNKNOWN_ERROR',
    data.message ?? fallbackMessage,
    status,
    data.fieldErrors,
  );
}

// --- 401 Interceptor / token refresh --------------------------------------

let refreshPromise: Promise<string> | null = null;

/** AuthBootstrapper 가 마운트 시 호출 — refreshToken 쿠키로 accessToken 부트스트랩. */
export async function bootstrapAccessToken(): Promise<string> {
  return refreshAccessToken();
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const data = await request<{ accessToken: string } | null>('POST', REFRESH_PATH, undefined, {
        _skipAuthRefresh: true,
        _skipAuthHeader: true,
      });
      const token = data?.accessToken;
      if (!token) {
        throw new ApiError('REFRESH_FAILED', 'Refresh response missing accessToken', 401);
      }
      useAuthStore.getState().setAccessToken(token);
      return token;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function handleAuthFailure(): ApiError {
  useAuthStore.getState().clear();
  triggerUnauthorized();
  return new ApiError('UNAUTHORIZED', 'Session expired', 401);
}

// --- Core request ---------------------------------------------------------

async function dispatch(
  method: Method,
  url: string,
  body: unknown,
  config: RequestConfig,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers ?? {}),
  };

  if (!config._skipAuthHeader) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: config.signal,
  });
}

export async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  config: RequestConfig = {},
): Promise<T> {
  const url = buildUrl(path, config.query);

  let response: Response;
  try {
    response = await dispatch(method, url, body, config);
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Network request failed', 0);
  }

  if (response.status === 401 && !config._skipAuthRefresh) {
    // Spring 의 에러 디스패치 경로에서 405 Method Not Allowed 가 401 로 오염되는 경우가 있다.
    // 표준 405 응답에만 붙는 `Allow` 헤더가 있으면 토큰 만료가 아닌 메서드 불일치로 간주하고
    // refresh 루프를 건너뛰어 사용자 세션을 보존한다.
    if (response.headers.get('Allow')) {
      const parsed = await parseBody(response);
      throw toApiError(parsed, 405, 'Method not allowed');
    }

    try {
      await refreshAccessToken();
    } catch {
      throw handleAuthFailure();
    }

    try {
      response = await dispatch(method, url, body, config);
    } catch {
      throw new ApiError('NETWORK_ERROR', 'Network request failed', 0);
    }

    if (response.status === 401) {
      throw handleAuthFailure();
    }
  }

  const parsed = await parseBody(response);

  if (!response.ok) {
    throw toApiError(parsed, response.status, response.statusText || 'Request failed');
  }

  const apiResponse = parsed as ApiResponse<T> | null;
  if (apiResponse && apiResponse.success === false) {
    throw toApiError(parsed, response.status, apiResponse.message ?? 'Request failed');
  }

  return (apiResponse?.data ?? null) as T;
}

export const apiClient = {
  get: <T>(path: string, config?: RequestConfig) => request<T>('GET', path, undefined, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('POST', path, body, config),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', path, body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PUT', path, body, config),
  delete: <T>(path: string, config?: RequestConfig) =>
    request<T>('DELETE', path, undefined, config),
};
