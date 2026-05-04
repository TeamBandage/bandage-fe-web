import { env } from '@/global/config/env';

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

/**
 * Kakao 동의 popup 을 띄워 access token 을 발급받는다.
 * 사용자가 popup 을 닫거나 차단되면 reject. 정상 동의 시 access token 만 반환.
 */
export async function requestKakaoAccessToken(): Promise<string> {
  const kakao = await loadKakao();
  return new Promise<string>((resolve, reject) => {
    kakao.Auth.login({
      scope: 'profile_nickname,account_email',
      success: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error('Kakao 로그인 응답에 access_token 이 없습니다.'));
      },
      fail: (error) => {
        const msg = error.error_description || error.error || '카카오 로그인에 실패했습니다.';
        reject(new Error(msg));
      },
    });
  });
}
