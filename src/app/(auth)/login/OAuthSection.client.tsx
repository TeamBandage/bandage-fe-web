'use client';

import { useEffect, useRef } from 'react';

import { OAuthButton } from '@/components/ui/oauth-button';
import { renderGoogleButton } from '@/domain/auth/oauth';
import { env } from '@/global/config/env';
import { useToast } from '@/hooks/useToast';

/**
 * OAuth 로그인 섹션.
 *
 * Google: GIS ux_mode:'redirect' — 버튼 클릭 시 Google 인증 페이지로 리다이렉트.
 * 인증 완료 후 Google 이 /api/oauth/google/callback(Route Handler)으로 POST → /oauth/callback/google 로 이동.
 * FedCM / 쿨다운 / Chrome 팝업 차단 등 브라우저 정책의 영향을 받지 않는다.
 *
 * 카카오/애플 로그인은 사업자 등록 등 외부 사유로 일시 보류 — 코드는 보존하고 UI 만 숨긴다.
 * 재개 시 아래 import / handler / OAuthButton JSX 의 주석을 해제하면 즉시 동작 (BE contract 변경 없음).
 *
 * BE contract:
 * - POST /api/v1/auth/oauth/google body { idToken }
 * - 응답 { accessToken, isNewMember } + Set-Cookie refreshToken
 */
export function OAuthSection() {
  const toast = useToast();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const googleEnabled = !!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleEnabled || !googleButtonRef.current) return;
    renderGoogleButton(googleButtonRef.current).catch((err) => {
      toast.error(err instanceof Error ? err.message : '구글 로그인을 초기화할 수 없습니다.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleEnabled]);

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

        <OAuthButton provider="kakao" onClick={handleKakao} />
        <OAuthButton provider="apple" onClick={notReady} />
      */}

      {/*
        GIS iframe을 커스텀 버튼 위에 투명 overlay로 마운트.
        redirect 모드에서는 GIS iframe이 직접 사용자 클릭을 받아야 리다이렉트가 트리거된다.
        programmatic .click()은 cross-origin iframe에 전달되지 않으므로 overlay 방식을 사용.
      */}
      <div className="relative cursor-pointer">
        <OAuthButton provider="google" className="pointer-events-none rounded-[5px]" />
        <div
          ref={googleButtonRef}
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden opacity-0"
        />
      </div>
    </section>
  );
}
