import { env } from '@/global/config/env';

const SDK_URL = 'https://accounts.google.com/gsi/client';

let loadPromise: Promise<NonNullable<Window['google']>> | null = null;
let initialized = false;
let pendingResolver: ((idToken: string) => void) | null = null;
let pendingRejecter: ((err: Error) => void) | null = null;

/**
 * Google Identity Services 스크립트를 동적으로 로드.
 * 이미 로드되어 있으면 바로 반환. 한 번만 로드되고 이후 호출은 캐시.
 */
export async function loadGoogleGis(): Promise<NonNullable<Window['google']>> {
  if (typeof window === 'undefined') {
    throw new Error('SSR 환경에서는 GIS 를 로드할 수 없습니다.');
  }
  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    throw new Error('Google 로그인이 설정되지 않았습니다 (NEXT_PUBLIC_GOOGLE_CLIENT_ID 누락).');
  }
  if (window.google?.accounts?.id) return window.google;
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('GIS 로드 후 window.google.accounts.id 가 비어 있습니다.'));
    };
    script.onerror = () => reject(new Error('Google GIS 스크립트를 로드할 수 없습니다.'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

function ensureInitialized(google: NonNullable<Window['google']>) {
  if (initialized) return;
  google.accounts.id.initialize({
    client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    callback: (response) => {
      const resolver = pendingResolver;
      const rejecter = pendingRejecter;
      pendingResolver = null;
      pendingRejecter = null;
      if (response.credential) resolver?.(response.credential);
      else rejecter?.(new Error('Google 로그인 응답에 credential 이 없습니다.'));
    },
    use_fedcm_for_prompt: true,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin',
  });
  initialized = true;
}

/**
 * GIS One Tap / Sign In With Google prompt 를 띄워 ID token (JWT) 을 발급받는다.
 *
 * 주의: prompt 가 표시되지 않는 경우가 많다 (브라우저 third-party cookie 차단,
 * 짧은 시간 내 반복 호출, 동의 거부 직후 등). FedCM 옵션을 켜서 최신 Chrome 에서는
 * cookie 정책과 무관하게 동작하지만, Safari / Firefox 에서는 여전히 막힐 수 있다.
 * 호출 측은 reject 메시지에 따라 표준 GIS 버튼으로 fallback 안내가 필요할 수 있다.
 */
export async function requestGoogleIdToken(): Promise<string> {
  const google = await loadGoogleGis();
  ensureInitialized(google);
  // 이전 호출이 끝나기 전 동시에 호출되면 이전 호출은 취소.
  if (pendingRejecter) pendingRejecter(new Error('이전 Google 로그인 시도가 취소되었습니다.'));

  return new Promise<string>((resolve, reject) => {
    pendingResolver = resolve;
    pendingRejecter = reject;
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        pendingResolver = null;
        pendingRejecter = null;
        const reason = notification.getNotDisplayedReason();
        reject(
          new Error(
            `Google 로그인 창을 표시할 수 없습니다 (${reason}). 브라우저의 third-party cookie 차단 또는 시크릿 모드를 확인해주세요.`,
          ),
        );
      } else if (notification.isSkippedMoment()) {
        pendingResolver = null;
        pendingRejecter = null;
        reject(new Error('Google 로그인이 취소되었습니다.'));
      }
      // dismissed/displayed 는 callback 에서 처리됨.
    });
  });
}
