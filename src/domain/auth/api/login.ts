import { apiClient } from '@/global/api/apiClient';
import { useAuthStore } from '@/global/store/authStore';

import type { LoginRequest, LoginResponse } from '../types';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const data = await apiClient.post<LoginResponse>('/api/v1/auth/login', req);
  if (!data?.accessToken) {
    throw new Error('로그인 응답에 accessToken이 없습니다.');
  }
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data;
}
