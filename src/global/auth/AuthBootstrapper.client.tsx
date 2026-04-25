'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';
import { setUnauthorizedHandler } from '@/global/api/apiClient';
import { ROUTES } from '@/global/config/routes';
import { useAuthStore } from '@/global/store/authStore';
import { useToast } from '@/hooks/useToast';

interface Props {
  children: ReactNode;
}

/**
 * 보호된 (main) 레이아웃의 인증 부트스트랩.
 *
 * 책임
 * 1. 401 → refresh 실패 시 useAuthStore.clear + Next.js 라우터 replace('/login') (window.location 대신)
 *    + "세션이 만료되었습니다" 토스트.
 * 2. 첫 진입 시 useMe 가 settled 될 때까지 Skeleton 으로 children 가드 — 토큰 없는 채 /home 이
 *    잠깐 렌더되는 깜빡임 방지.
 *
 * 미들웨어(refreshToken 쿠키 검사) 와 직교: 미들웨어가 차단하지 못하는 "쿠키 유효 + accessToken 메모리 무"
 * 케이스를 클라이언트 레이어에서 보강.
 */
export function AuthBootstrapper({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { data, isPending, isError } = useMe();
  const authenticated = useAuthStore((s) => s.accessToken !== null);
  const handlerInstalled = useRef(false);

  // 401 핸들러 등록 — 마운트 시 1회.
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

  // useMe 가 에러로 끝났을 때 (refresh 도 실패한 직후) 추가 안전망.
  useEffect(() => {
    if (isError && !authenticated) {
      const from = searchParams?.toString();
      const url = from ? `${ROUTES.LOGIN}?from=${encodeURIComponent(from)}` : ROUTES.LOGIN;
      router.replace(url);
    }
  }, [isError, authenticated, router, searchParams]);

  if (isPending && !data) {
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
