import { env } from '@/global/config/env';

const SDK_URL = 'https://accounts.google.com/gsi/client';

let loadPromise: Promise<NonNullable<Window['google']>> | null = null;
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
 * GIS renderButton 을 ux_mode:'redirect' 로 초기화한다.
 *
 * 버튼 클릭 시 Google 인증 페이지로 리다이렉트되며, 인증 완료 후 Google 이
 * login_uri(Route Handler)로 credential 을 POST 한다.
 * FedCM / 쿨다운 / Chrome 팝업 차단 등 브라우저 정책의 영향을 받지 않는다.
 *
 * initialize()는 페이지 세션당 한 번만 호출한다.
 */
export async function renderGoogleButton(element: HTMLElement): Promise<void> {
  const google = await loadGoogleGis();

  if (!isInitialized) {
    google.accounts.id.initialize({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'redirect',
      login_uri: `${window.location.origin}/api/oauth/google/callback`,
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
