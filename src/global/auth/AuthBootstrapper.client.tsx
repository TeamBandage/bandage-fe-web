'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';
import { bootstrapAccessToken, setUnauthorizedHandler } from '@/global/api/apiClient';
import { ROUTES } from '@/global/config/routes';
import { useAuthStore } from '@/global/store/authStore';
import { useToast } from '@/hooks/useToast';

interface Props {
  children: ReactNode;
}

/**
 * 보호된 (main) 레이아웃의 인증 부트스트랩.
 *
 * 동작 순서
 * 1. 마운트 시 401 핸들러 등록 (refresh 실패 → /login 라우팅 + 토스트).
 * 2. accessToken 이 메모리에 없으면 refresh 한 번 시도 (refreshToken 쿠키 기반).
 *    - 성공 → useMe 가 활성화되어 children 렌더 가능.
 *    - 실패 → /login 으로 라우팅.
 * 3. 부트스트랩 진행 중에는 Skeleton 으로 children 가드 → /home 깜빡임 방지.
 */
export function AuthBootstrapper({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const authenticated = useAuthStore((s) => s.accessToken !== null);
  const handlerInstalled = useRef(false);
  const bootstrapTried = useRef(false);
  const [bootstrapping, setBootstrapping] = useState(!authenticated);

  // 401 핸들러 등록.
  useEffect(() => {
    if (handlerInstalled.current) return;
    handlerInstalled.current = true;
    setUnauthorizedHandler(() => {
      const current = window.location.pathname + window.location.search;
      const url = `${ROUTES.LOGIN}?from=${encodeURIComponent(current)}`;
      router.replace(url);
      toast.error('세션이 만료되었습니다. 다시 로그인해 주세요.');
    });
  }, [router, toast]);

  // accessToken 부트스트랩.
  useEffect(() => {
    if (bootstrapTried.current) return;
    bootstrapTried.current = true;
    if (authenticated) {
      setBootstrapping(false);
      return;
    }
    bootstrapAccessToken()
      .then(() => setBootstrapping(false))
      .catch(() => {
        // refresh 실패 → /login 으로 (handleAuthFailure 가 이미 처리하지만 안전망).
        setBootstrapping(false);
        const from = searchParams?.toString();
        const url = from ? `${ROUTES.LOGIN}?from=${encodeURIComponent(from)}` : ROUTES.LOGIN;
        router.replace(url);
      });
  }, [authenticated, router, searchParams]);

  // useMe 는 인증 후에만 자연스럽게 동작 — 깜빡임 가드는 부트스트랩 완료까지만.
  const me = useMe();

  if (bootstrapping || (authenticated && me.isPending && !me.data)) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}

function AuthLoadingSkeleton() {
  return (
    <div className="p-s-6 space-y-s-3" aria-busy="true" aria-label="로그인 상태 확인 중">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full" rounded="lg" />
      <Skeleton className="h-32 w-full" rounded="lg" />
    </div>
  );
}
