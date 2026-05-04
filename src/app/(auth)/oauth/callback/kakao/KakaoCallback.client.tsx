'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useKakaoLogin } from '@/domain/auth/hooks/useKakaoLogin';
import { buildKakaoRedirectUri, consumeKakaoState, oauthErrorMessage } from '@/domain/auth/oauth';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

/**
 * Kakao OAuth callback handler.
 *
 * 1. URL 의 `code` / `state` 추출 (or `error` 파라미터)
 * 2. state 검증 (CSRF)
 * 3. BE `POST /auth/oauth/kakao { code, redirectUri, state }` — BE 가 token 교환 + user info + JWT 발급
 * 4. /home 으로 redirect (가입 / 로그인 분기 토스트 포함)
 *
 * 본 화면은 token endpoint 를 직접 호출하지 않는다 — Authorization Code 흐름이 BE 로 이관됨.
 * (자세한 BE 명세는 `API_REQUIRED_OAUTH_KAKAO_0504.md`)
 */
export function KakaoCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useKakaoLogin({
    onSuccess: (data) => {
      toast.success(data.isNewMember ? '환영합니다. 가입이 완료되었습니다.' : '로그인되었습니다.');
      router.replace(ROUTES.HOME);
    },
    onError: (err) => {
      const msg = oauthErrorMessage(err);
      setError(msg);
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    const stateParam = params.get('state');
    const providerError = params.get('error');
    const providerErrorDesc = params.get('error_description');

    if (providerError) {
      const msg = providerErrorDesc || providerError;
      const display = `카카오 인증이 취소되었거나 실패했습니다: ${msg}`;
      setError(display);
      toast.error('카카오 인증이 취소되었습니다.');
      return;
    }

    if (!code) {
      setError('카카오 인증 코드를 받지 못했습니다.');
      return;
    }

    const expectedState = consumeKakaoState();
    if (!expectedState || expectedState !== stateParam) {
      setError('CSRF 검증에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    const redirectUri = buildKakaoRedirectUri();
    mutation.mutate({ code, redirectUri, state: stateParam ?? undefined });
  }, [params, toast, mutation]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="space-y-3">
            <p className="text-danger text-sm">{error}</p>
            <a href={ROUTES.LOGIN} className="text-accent text-sm hover:underline">
              로그인 화면으로 돌아가기
            </a>
          </div>
        ) : (
          <div className="text-foreground-sub flex items-center gap-3 text-sm">
            <Spinner size="md" />
            <span>카카오 로그인 처리 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}
