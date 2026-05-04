export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  originalPassword: string;
  newPassword: string;
}

/** BE: POST /api/v1/auth/oauth/kakao */
export interface KakaoLoginRequest {
  /** Kakao SDK 가 발급한 access token. */
  accessToken: string;
}

/** BE: POST /api/v1/auth/oauth/google */
export interface GoogleLoginRequest {
  /** GIS 가 발급한 ID token (JWT). */
  idToken: string;
}
