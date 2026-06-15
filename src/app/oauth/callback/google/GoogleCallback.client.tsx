'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { useGoogleLogin } from '@/domain/auth/hooks/useGoogleLogin';
import { oauthErrorMessage } from '@/domain/auth/oauth';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function GoogleCallback() {
  const router = useRouter();
  const toast = useToast();
  const ran = useRef(false);

  const mutation = useGoogleLogin({
    onSuccess: (data) => {
      toast.success(data.isNewMember ? '환영합니다. 가입이 완료되었습니다.' : '로그인되었습니다.');
      router.replace(ROUTES.HOME);
    },
    onError: (err) => {
      toast.error(oauthErrorMessage(err));
      router.replace(ROUTES.LOGIN);
    },
  });

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const credential = document.cookie
      .split('; ')
      .find((row) => row.startsWith('_g_credential='))
      ?.split('=')[1];

    document.cookie = '_g_credential=; Max-Age=0; Path=/';

    if (!credential) {
      toast.error('구글 인증 정보를 받지 못했습니다.');
      router.replace(ROUTES.LOGIN);
      return;
    }

    mutation.mutate({ idToken: credential });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-foreground-sub flex items-center gap-3 text-sm">
        <Spinner size="md" />
        <span>구글 로그인 처리 중...</span>
      </div>
    </div>
  );
}
