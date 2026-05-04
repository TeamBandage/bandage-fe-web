'use client';

import { useRouter } from 'next/navigation';

import { OAuthButton } from '@/components/ui/oauth-button';
import { useGoogleLogin } from '@/domain/auth/hooks/useGoogleLogin';
import { oauthErrorMessage, requestGoogleIdToken } from '@/domain/auth/oauth';
import type { OAuthLoginResponse } from '@/domain/auth/types';
import { env } from '@/global/config/env';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

/**
 * OAuth 로그인 섹션.
 *
 * Google: GIS prompt() 로 in-place ID token 발급 → BE 에 바로 전달.
 *
 * 카카오/애플 로그인은 사업자 등록 등 외부 사유로 일시 보류 — 코드는 보존하고 UI 만 숨긴다.
 * 재개 시 아래 import / handler / OAuthButton JSX 의 주석을 해제하면 즉시 동작 (BE contract 변경 없음).
 *
 * BE contract:
 * - POST /api/v1/auth/oauth/google body { idToken }
 * - 응답 { accessToken, isNewMember } + Set-Cookie refreshToken
 */
export function OAuthSection() {
  const router = useRouter();
  const toast = useToast();

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

  return (
    <section aria-label="OAuth 로그인" className="space-y-s-3" data-slot="oauth-section">
      {/*
        Kakao / Apple 로그인 — 사업자 등록 등 외부 사유로 일시 보류.
        구현은 develop 에 유지되어 있으며 (`startKakaoAuthorize`, `KakaoCallback`),
        재개 시 아래 import + 핸들러 + 버튼만 다시 노출하면 즉시 사용 가능.

        import { startKakaoAuthorize } from '@/domain/auth/oauth';

        async function handleKakao() {
          if (!env.NEXT_PUBLIC_KAKAO_JS_KEY) {
            toast.error('카카오 로그인이 설정되지 않았습니다.');
            return;
          }
          try {
            await startKakaoAuthorize();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : '카카오 로그인을 시작할 수 없습니다.');
          }
        }

        const notReady = () => toast.info('준비 중입니다.');

        <OAuthButton provider="kakao" onClick={handleKakao} disabled={busy} />
        <OAuthButton provider="apple" onClick={notReady} disabled={busy} />
      */}
      <OAuthButton provider="google" onClick={handleGoogle} disabled={busy} />
    </section>
  );
}
