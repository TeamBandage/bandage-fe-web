import { env } from '@/global/config/env';

import { createKakaoState } from './kakaoState';

const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
/**
 * 공식 release 의 SRI 해시. SDK 버전 변경 시 함께 갱신.
 * https://developers.kakao.com/docs/latest/ko/javascript/getting-started
 */
const SDK_INTEGRITY = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka';

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

/** 콜백 URL 빌더. start/callback 양쪽이 동일 값을 사용해야 BE 의 token 교환 시 redirect_uri 검증 통과. */
export function buildKakaoRedirectUri(): string {
  if (typeof window === 'undefined') {
    throw new Error('SSR 환경에서는 redirect URI 를 만들 수 없습니다.');
  }
  return `${window.location.origin}/oauth/callback/kakao`;
}

/**
 * Kakao authorize 페이지로 redirect.
 *
 * v2.x SDK 는 popup 콜백 기반 `Kakao.Auth.login` 을 제공하지 않으므로
 * 표준 OAuth 2.0 Authorization Code 흐름의 시작 단계만 SDK 가 담당한다.
 * 이후 BE 가 받은 code 로 token 교환 + user info 조회 + JWT 발급을 모두 처리.
 * (BE 명세는 `API_REQUIRED_OAUTH_KAKAO_0504.md`)
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
