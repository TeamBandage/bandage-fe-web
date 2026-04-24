import { request } from '@/global/api/apiClient';
import { useAuthStore } from '@/global/store/authStore';

import type { RefreshResponse } from '../types';

export async function refresh(): Promise<RefreshResponse> {
  const data = await request<RefreshResponse>('POST', '/api/v1/auth/refresh', undefined, {
    _skipAuthRefresh: true,
    _skipAuthHeader: true,
  });
  if (!data?.accessToken) {
    throw new Error('refresh 응답에 accessToken이 없습니다.');
  }
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data;
}
