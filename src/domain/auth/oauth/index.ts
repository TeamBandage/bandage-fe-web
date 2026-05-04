export { loadKakao, requestKakaoAccessToken } from './kakao';
export { loadGoogleGis, requestGoogleIdToken } from './google';

import { ApiError } from '@/global/error/ApiError';

/**
 * OAuth 응답의 BE 에러 코드를 사용자 안내 문구로 매핑.
 * 코드 정의는 `v1/.../ErrorCode.kt` + 본 프로젝트 `API_REQUIRED_OAUTH_*` 참조.
 */
export function oauthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'OAUTH_TOKEN_INVALID':
        return '소셜 인증에 실패했습니다. 다시 시도해주세요.';
      case 'OAUTH_PROVIDER_MISMATCH':
        return '이미 다른 소셜 계정으로 가입된 이메일입니다.';
      case 'OAUTH_PROVIDER_ERROR':
        return '소셜 로그인 서버에 일시적인 오류가 있습니다. 잠시 후 다시 시도해주세요.';
      case 'INVALID_INPUT_VALUE':
        return '소셜 로그인 요청이 올바르지 않습니다.';
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return '소셜 로그인에 실패했습니다.';
}
