import { env } from '@/global/config/env';

const SDK_URL = 'https://accounts.google.com/gsi/client';

let loadPromise: Promise<NonNullable<Window['google']>> | null = null;
let currentCallback: ((idToken: string) => void) | null = null;
let isInitialized = false;

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

/**
 * GIS renderButton 을 사용해 element 에 Google 로그인 버튼을 렌더링한다.
 * prompt()(One Tap)와 달리 브라우저 억제(suppression)가 없어 항상 계정 선택 팝업을 연다.
 *
 * initialize()는 페이지 세션당 한 번만 호출한다 — 복수 호출 시 GIS 내부 상태가 꼬여
 * renderButton으로 그린 버튼 클릭 시 팝업이 열리지 않는 버그가 발생한다.
 * callback은 모듈 수준 currentCallback 포인터로 위임해 컴포넌트 재마운트 시에도 최신 핸들러를 유지한다.
 */
export async function renderGoogleButton(
  element: HTMLElement,
  onIdToken: (idToken: string) => void,
): Promise<void> {
  currentCallback = onIdToken;

  const google = await loadGoogleGis();

  if (!isInitialized) {
    google.accounts.id.initialize({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: (response) => {
        if (response.credential) currentCallback?.(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
    });
    isInitialized = true;
  }

  google.accounts.id.renderButton(element, {
    type: 'standard',
    size: 'large',
    theme: 'outline',
    text: 'signin_with',
    shape: 'rectangular',
  });
}
