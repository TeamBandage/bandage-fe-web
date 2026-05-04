export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  originalPassword: string;
  newPassword: string;
}

/**
 * BE: POST /api/v1/auth/oauth/kakao
 *
 * Authorization Code Grant — FE 는 Kakao authorize 단계에서 받은 code 만 BE 에 전달.
 * BE 가 Kakao token endpoint 호출 + user info 조회 + JWT 발급까지 담당.
 * (자세한 BE 명세는 `API_REQUIRED_OAUTH_KAKAO_0504.md` 참조.)
 */
export interface KakaoLoginRequest {
  /** Kakao authorize 단계에서 받은 authorization code. */
  code: string;
  /** FE 가 authorize 시 사용한 redirect URI. BE 의 token 교환에 동일값 필요. */
  redirectUri: string;
  /** (선택) FE CSRF state. BE 측 추가 검증이 필요한 경우만. */
  state?: string;
}

/** BE: POST /api/v1/auth/oauth/google */
export interface GoogleLoginRequest {
  /** GIS 가 발급한 ID token (JWT). */
  idToken: string;
}
