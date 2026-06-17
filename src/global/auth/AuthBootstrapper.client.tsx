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
 * 2. Zustand persist 하이드레이션 완료 대기 (sessionStorage → 메모리 복원).
 * 3. 하이드레이션 후 accessToken 이 있으면 bootstrap 스킵.
 *    없으면 refreshToken 쿠키로 POST /auth/refresh 한 번 시도.
 *    - 성공 → useMe 가 활성화되어 children 렌더 가능.
 *    - 실패 → /login 으로 라우팅.
 * 4. 부트스트랩 진행 중에는 Skeleton 으로 children 가드 → /home 깜빡임 방지.
 */
export function AuthBootstrapper({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const authenticated = useAuthStore((s) => s.accessToken !== null);
  const handlerInstalled = useRef(false);
  const bootstrapTried = useRef(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hydrated, setHydrated] = useState(false);

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

  // Zustand persist 하이드레이션 완료 감지 (클라이언트 전용).
  // useState(false)로 초기화해야 SSR의 noopStorage가 hasHydrated()=true를 반환하는 것을 방지.
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // 하이드레이션 완료 후 accessToken 여부에 따라 bootstrap 결정.
  // sessionStorage에 유효한 토큰이 있으면 bootstrap 스킵 — 불필요한 /refresh 호출 방지.
  useEffect(() => {
    if (!hydrated) return;
    if (bootstrapTried.current) return;
    bootstrapTried.current = true;
    if (authenticated) {
      setBootstrapping(false);
      return;
    }
    bootstrapAccessToken()
      .then(() => setBootstrapping(false))
      .catch(() => {
        setBootstrapping(false);
        const from = searchParams?.toString();
        const url = from ? `${ROUTES.LOGIN}?from=${encodeURIComponent(from)}` : ROUTES.LOGIN;
        router.replace(url);
      });
  }, [hydrated, authenticated, router, searchParams]);

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
