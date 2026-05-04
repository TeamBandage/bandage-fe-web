'use client';

import { useRouter } from 'next/navigation';

import { OAuthButton } from '@/components/ui/oauth-button';
import { useGoogleLogin } from '@/domain/auth/hooks/useGoogleLogin';
import { oauthErrorMessage, requestGoogleIdToken, startKakaoAuthorize } from '@/domain/auth/oauth';
import type { OAuthLoginResponse } from '@/domain/auth/types';
import { env } from '@/global/config/env';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

/**
 * OAuth 로그인 섹션.
 *
 * Kakao: SDK 2.x 가 popup `login` 을 제거했으므로 `Kakao.Auth.authorize` 로 페이지 redirect →
 *        callback page 가 token 교환 + BE 호출. 클릭 시 페이지가 즉시 카카오로 이동한다.
 * Google: GIS prompt() 로 in-place ID token 발급 → BE 에 바로 전달.
 *
 * BE contract:
 * - POST /api/v1/auth/oauth/kakao  body { accessToken }
 * - POST /api/v1/auth/oauth/google body { idToken }
 * - 응답 { accessToken, isNewMember } + Set-Cookie refreshToken
 */
export function OAuthSection() {
  const router = useRouter();
  const toast = useToast();

  const kakaoEnabled = !!env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const googleEnabled = !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const onLoginSuccess = (data: OAuthLoginResponse) => {
    toast.success(data.isNewMember ? '환영합니다. 가입이 완료되었습니다.' : '로그인되었습니다.');
    router.replace(ROUTES.HOME);
  };

  const googleMutation = useGoogleLogin({
    onSuccess: onLoginSuccess,
    onError: (err) => toast.error(oauthErrorMessage(err)),
  });

  const busy = googleMutation.isPending;

  async function handleKakao() {
    if (!kakaoEnabled) {
      toast.error('카카오 로그인이 설정되지 않았습니다.');
      return;
    }
    try {
      // SDK 가 페이지를 카카오 authorize URL 로 이동시킨다. 이후 흐름은 callback page 가 담당.
      await startKakaoAuthorize();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '카카오 로그인을 시작할 수 없습니다.');
    }
  }

  async function handleGoogle() {
    if (!googleEnabled) {
      toast.error('구글 로그인이 설정되지 않았습니다.');
      return;
    }
    try {
      const idToken = await requestGoogleIdToken();
      googleMutation.mutate({ idToken });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '구글 로그인에 실패했습니다.');
    }
  }

  const notReady = () => toast.info('준비 중입니다.');

  return (
    <section aria-label="OAuth 로그인" className="space-y-s-3" data-slot="oauth-section">
      <OAuthButton provider="kakao" onClick={handleKakao} disabled={busy} />
      <OAuthButton provider="google" onClick={handleGoogle} disabled={busy} />
      <OAuthButton provider="apple" onClick={notReady} disabled={busy} />
      <div className="gap-s-3 py-s-2 flex items-center">
        <span className="bg-border h-px flex-1" aria-hidden="true" />
        <span className="text-foreground-muted text-micro">또는</span>
        <span className="bg-border h-px flex-1" aria-hidden="true" />
      </div>
    </section>
  );
}
