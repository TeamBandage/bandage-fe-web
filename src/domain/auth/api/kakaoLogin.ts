import { apiClient } from '@/global/api/apiClient';
import { useAuthStore } from '@/global/store/authStore';

import type { KakaoLoginRequest, OAuthLoginResponse } from '../types';

/**
 * BE: POST /api/v1/auth/oauth/kakao
 *
 * 본 호출은 인증 전 흐름이므로 401 인터셉터의 refresh 루프를 건너뛴다.
 * (BE 의 401 OAUTH_TOKEN_INVALID 가 자동으로 refresh 시도로 가로채지지 않게.)
 */
export async function kakaoLogin(req: KakaoLoginRequest): Promise<OAuthLoginResponse> {
  const data = await apiClient.post<OAuthLoginResponse>('/api/v1/auth/oauth/kakao', req, {
    _skipAuthRefresh: true,
    _skipAuthHeader: true,
  });
  if (!data?.accessToken) {
    throw new Error('Kakao 로그인 응답에 accessToken 이 없습니다.');
  }
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data;
}
