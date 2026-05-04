/**
 * Kakao JavaScript SDK 2.x 의 최소 표면 (로그인용).
 * 전체 명세는 https://developers.kakao.com/sdk/reference/js/release/Kakao.html
 */
interface KakaoAuthSuccess {
  /** Access token. BE 의 POST /api/v1/auth/oauth/kakao 의 accessToken 필드로 전달. */
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface KakaoAuthError {
  error: string;
  error_description: string;
}

interface KakaoAuthLoginOptions {
  /** 동의 항목. 콤마 구분. 예: 'profile_nickname,account_email'. */
  scope?: string;
  /** Kakao 로그인 popup 닫힘 후 호출. */
  success: (response: KakaoAuthSuccess) => void;
  /** popup 차단/사용자 취소/네트워크 오류 등. */
  fail: (error: KakaoAuthError) => void;
  /** 성공/실패와 무관하게 호출. */
  always?: () => void;
}

interface KakaoStatic {
  init(jsKey: string): void;
  isInitialized(): boolean;
  Auth: {
    login(options: KakaoAuthLoginOptions): void;
    logout(callback?: () => void): void;
    getAccessToken(): string | null;
  };
}

interface Window {
  Kakao?: KakaoStatic;
}
