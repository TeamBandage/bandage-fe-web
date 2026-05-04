/**
 * Kakao JavaScript SDK 2.x 의 최소 표면.
 * v2.x 부터 `Kakao.Auth.login` 은 제거됨 — `Kakao.Auth.authorize` (redirect) 가 표준.
 * 전체 명세는 https://developers.kakao.com/sdk/reference/js/release/Kakao.Auth.html
 */
interface KakaoAuthAuthorizeOptions {
  redirectUri: string;
  /** 동의 항목. 콤마 구분. 예: 'profile_nickname,account_email'. */
  scope?: string;
  /** CSRF 방지용 임의 문자열. callback URL 의 state 파라미터로 그대로 돌아옴. */
  state?: string;
  nonce?: string;
  prompt?: 'login' | 'create' | 'none';
  /** true 면 카카오톡 앱으로 인증 시도. default true. */
  throughTalk?: boolean;
}

interface KakaoStatic {
  init(jsKey: string): void;
  isInitialized(): boolean;
  Auth: {
    /** Kakao 로그인 페이지로 redirect. 함수 호출 직후 페이지가 이동된다. */
    authorize(options: KakaoAuthAuthorizeOptions): void;
    setAccessToken(token: string): void;
    getAccessToken(): string | null;
    logout(callback?: () => void): void;
  };
}

interface Window {
  Kakao?: KakaoStatic;
}
