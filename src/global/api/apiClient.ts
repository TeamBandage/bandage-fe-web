import { env } from '@/global/config/env';
import { ROUTES } from '@/global/config/routes';
import { ApiError, type ApiErrorFieldErrors } from '@/global/error/ApiError';
import { useAuthStore } from '@/global/store/authStore';
import type { ApiResponse } from '@/global/types/api';

type QueryValue = string | number | boolean | null | undefined;

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

export async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  config: RequestConfig = {},
): Promise<T> {
  const url = buildUrl(path, config.query);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers ?? {}),
  };

  if (!config._skipAuthHeader) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: config.signal,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Network request failed', 0);
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
