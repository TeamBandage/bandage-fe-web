'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { OAuthButton } from '@/components/ui/oauth-button';
import { useGoogleLogin } from '@/domain/auth/hooks/useGoogleLogin';
import { oauthErrorMessage, renderGoogleButton } from '@/domain/auth/oauth';
import type { OAuthLoginResponse } from '@/domain/auth/types';
import { env } from '@/global/config/env';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

/**
 * OAuth 로그인 섹션.
 *
 * Google: GIS renderButton 으로 계정 선택 팝업을 열어 idToken 발급 → BE 전달.
 * prompt()(One Tap) 대신 renderButton 을 사용해 브라우저 억제(suppression) 문제를 해소함.
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
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const googleEnabled = !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const onLoginSuccess = (data: OAuthLoginResponse) => {
    toast.success(data.isNewMember ? '환영합니다. 가입이 완료되었습니다.' : '로그인되었습니다.');
    router.replace(ROUTES.HOME);
  };

  const googleMutation = useGoogleLogin({
    onSuccess: onLoginSuccess,
    onError: (err) => toast.error(oauthErrorMessage(err)),
  });

  // mutate 최신 참조를 ref 로 유지해 effect 재실행 없이 항상 최신 함수 호출
  const mutateRef = useRef(googleMutation.mutate);
  mutateRef.current = googleMutation.mutate;

  useEffect(() => {
    if (!googleEnabled || !googleButtonRef.current) return;
    renderGoogleButton(googleButtonRef.current, (idToken) => {
      mutateRef.current({ idToken });
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : '구글 로그인을 초기화할 수 없습니다.');
    });
    // googleEnabled 가 바뀔 때만 재렌더링
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleEnabled]);

  const busy = googleMutation.isPending;

  function handleGoogle() {
    if (!googleEnabled) {
      toast.error('구글 로그인이 설정되지 않았습니다.');
      return;
    }
    // use_fedcm_for_prompt: false 로 FedCM을 비활성화했으므로
    // renderButton 클릭이 전통적인 OAuth 팝업으로 열린다 (FedCM 쿨다운 무관).
    const btn = googleButtonRef.current?.querySelector<HTMLElement>('div[role=button]');
    btn?.click();
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

      {/* GIS renderButton 마운트 대상 — 화면 밖에 숨겨 시각적으로 노출하지 않음 */}
      <div
        ref={googleButtonRef}
        aria-hidden="true"
        style={{ position: 'fixed', top: -9999, left: -9999 }}
      />

      <OAuthButton
        provider="google"
        onClick={handleGoogle}
        disabled={busy}
        className="rounded-[5px]"
      />
    </section>
  );
}
