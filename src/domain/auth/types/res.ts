export interface LoginResponse {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

/** BE: POST /api/v1/auth/oauth/{provider} 응답 본문. */
export interface OAuthLoginResponse {
  accessToken: string;
  /** true=신규 회원가입+로그인, false=기존 회원 로그인. 가입 직후 온보딩 분기에 사용. */
  isNewMember: boolean;
}
