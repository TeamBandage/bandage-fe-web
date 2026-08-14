'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { GuardedLink as Link } from '@/global/navigation/guarded-link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout } from '@/domain/auth/hooks/useLogout';
import { useMe } from '@/domain/member/hooks/useMe';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MENU_ITEM_CLASS =
  'flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-medium outline-none';

export function ProfileMenu({ open, onOpenChange }: Props) {
  const [view, setView] = useState<'main' | 'language'>('main');
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { data: me, isLoading: meLoading } = useMe();

  const logoutMutation = useLogout({
    onSuccess: () => {
      toast.success('로그아웃되었습니다.');
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '로그아웃에 실패했습니다.'),
  });

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onOpenChange]);

  // 닫힐 때 언어 설정 하위 화면에 머물러 있던 상태 초기화.
  useEffect(() => {
    if (!open) setView('main');
  }, [open]);

  return (
    <div ref={containerRef} className="relative lg:hidden">
      {meLoading ? (
        <Skeleton rounded="pill" className="h-7 w-7 shrink-0" />
      ) : (
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label="프로필 메뉴"
          aria-expanded={open}
          className={cn(
            'inline-flex items-center rounded-full transition-colors',
            'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          )}
        >
          <Avatar
            src={me?.profileImg ?? undefined}
            fallback={me?.name ?? me?.email ?? '?'}
            className="h-7 w-7 text-xs"
          />
        </button>
      )}

      {open && (
        <div
          className="bg-card border-border absolute top-full right-0.5 z-50 mt-1.5 w-48 rounded-xl border py-1 shadow-xl"
          role="dialog"
          aria-label="프로필 메뉴"
        >
          {view === 'main' ? (
            <>
              <button
                type="button"
                onClick={() => setView('language')}
                className={cn(MENU_ITEM_CLASS, 'text-foreground hover:bg-surface-hi')}
              >
                언어설정
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </button>
              <Link
                href={ROUTES.ME}
                onClick={() => onOpenChange(false)}
                className={cn(
                  MENU_ITEM_CLASS,
                  'text-foreground hover:bg-surface-hi no-underline hover:no-underline',
                )}
              >
                마이페이지
              </Link>
              <div className="border-border my-1 border-t" />
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className={cn(MENU_ITEM_CLASS, 'text-danger hover:bg-surface-hi')}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView('main')}
                className={cn(
                  MENU_ITEM_CLASS,
                  'text-foreground hover:bg-surface-hi border-border border-b',
                )}
              >
                <span className="flex items-center gap-2">
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  언어설정
                </span>
              </button>
              <div className={cn(MENU_ITEM_CLASS, 'text-foreground')}>
                한국어
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
