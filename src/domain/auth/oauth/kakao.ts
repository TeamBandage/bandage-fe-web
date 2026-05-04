import { env } from '@/global/config/env';

import { createKakaoState } from './kakaoState';

const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
/**
 * 공식 release 의 SRI 해시. SDK 버전 변경 시 함께 갱신.
 * https://developers.kakao.com/docs/latest/ko/javascript/getting-started
 */
const SDK_INTEGRITY = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka';

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

let loadPromise: Promise<KakaoStatic> | null = null;

/**
 * Kakao JavaScript SDK 를 동적으로 로드 + Kakao.init 까지 수행한다.
 * 한 번만 로드되고 이후 호출은 캐시된 promise 를 반환.
 */
export async function loadKakao(): Promise<KakaoStatic> {
  if (typeof window === 'undefined') {
    throw new Error('SSR 환경에서는 Kakao SDK 를 로드할 수 없습니다.');
  }
  if (!env.NEXT_PUBLIC_KAKAO_JS_KEY) {
    throw new Error('Kakao 로그인이 설정되지 않았습니다 (NEXT_PUBLIC_KAKAO_JS_KEY 누락).');
  }
  if (window.Kakao?.isInitialized?.()) return window.Kakao;
  if (loadPromise) return loadPromise;

  const jsKey = env.NEXT_PUBLIC_KAKAO_JS_KEY;
  loadPromise = new Promise<KakaoStatic>((resolve, reject) => {
    if (window.Kakao) {
      try {
        window.Kakao.init(jsKey);
        resolve(window.Kakao);
      } catch (e) {
        reject(e);
      }
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      if (!window.Kakao) {
        reject(new Error('Kakao SDK 로드 후 window.Kakao 가 비어 있습니다.'));
        return;
      }
      try {
        window.Kakao.init(jsKey);
        resolve(window.Kakao);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error('Kakao SDK 스크립트를 로드할 수 없습니다.'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** 콜백 URL 빌더. start/callback 양쪽이 동일 값을 사용해야 token 교환 시 redirect_uri 검증 통과. */
export function buildKakaoRedirectUri(): string {
  if (typeof window === 'undefined') {
    throw new Error('SSR 환경에서는 redirect URI 를 만들 수 없습니다.');
  }
  return `${window.location.origin}/oauth/callback/kakao`;
}

/**
 * Kakao authorize 페이지로 redirect.
 * v2.x SDK 는 popup/callback 기반 `Kakao.Auth.login` 을 제공하지 않으므로
 * 표준 OAuth 2.0 Authorization Code 흐름의 시작 단계만 SDK 가 담당하고,
 * 이후 token 교환은 callback 페이지에서 FE 가 직접 처리한다.
 */
export async function startKakaoAuthorize(): Promise<void> {
  const kakao = await loadKakao();
  const redirectUri = buildKakaoRedirectUri();
  const state = createKakaoState();
  kakao.Auth.authorize({
    redirectUri,
    scope: 'profile_nickname,account_email',
    state,
  });
  // 호출 직후 페이지가 Kakao authorize URL 로 이동한다. 이 함수는 사실상 반환하지 않음.
}

interface KakaoTokenSuccess {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface KakaoTokenError {
  error: string;
  error_description?: string;
  error_code?: string;
}

/**
 * Kakao token endpoint 에 직접 POST 하여 access_token 을 받는다.
 *
 * 카카오 콘솔의 [보안 → Client Secret] 이 `사용 OFF` 인 경우 client_id (= JavaScript 키) 만으로
 * 교환 가능. ON 이라면 client_secret 이 필요한데 FE 에는 보관하지 않으므로 콘솔에서 OFF 권장.
 */
export async function exchangeKakaoCodeForAccessToken(input: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  if (!env.NEXT_PUBLIC_KAKAO_JS_KEY) {
    throw new Error('NEXT_PUBLIC_KAKAO_JS_KEY 가 설정되지 않았습니다.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.NEXT_PUBLIC_KAKAO_JS_KEY,
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  let response: Response;
  try {
    response = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
  } catch {
    throw new Error('Kakao 토큰 교환 중 네트워크 오류가 발생했습니다.');
  }

  const json: KakaoTokenSuccess | KakaoTokenError = await response
    .json()
    .catch(() => ({}) as never);
  if (!response.ok) {
    const err = json as KakaoTokenError;
    const detail = err.error_description || err.error || `HTTP ${response.status}`;
    throw new Error(`Kakao 토큰 교환 실패: ${detail}`);
  }

  const ok = json as KakaoTokenSuccess;
  if (!ok.access_token) {
    throw new Error('Kakao 토큰 응답에 access_token 이 없습니다.');
  }
  return ok.access_token;
}
