/**
 * Google Identity Services (GIS) 의 최소 표면 (ID token 발급용).
 * 전체 명세는 https://developers.google.com/identity/gsi/web/reference/js-reference
 */
interface GoogleIdConfiguration {
  client_id: string;
  /** popup 모드에서 credential 수신 콜백. redirect 모드에서는 사용되지 않음. */
  callback?: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  /** redirect 모드에서 Google 이 credential 을 POST 할 URI. */
  login_uri?: string;
}

interface GoogleCredentialResponse {
  /** ID token (JWT). BE 의 POST /api/v1/auth/oauth/google 의 idToken 필드로 전달. */
  credential: string;
  /** 이전 세션에서 자동 선택된 경우 true. */
  select_by?: string;
}

interface GooglePromptMomentNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
  getNotDisplayedReason(): string;
  getSkippedReason(): string;
  getDismissedReason(): string;
  getMomentType(): 'display' | 'skipped' | 'dismissed';
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  prompt(notification?: (n: GooglePromptMomentNotification) => void): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  cancel(): void;
  disableAutoSelect(): void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}
