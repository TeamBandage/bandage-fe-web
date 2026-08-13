'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/domain/notification/components/NotificationBell.client';
import { useMe } from '@/domain/member/hooks/useMe';
import { Avatar } from '@/components/ui/avatar';
import { ROUTES } from '@/global/config/routes';

export function GlobalTopbar() {
  const { data: me, isLoading: meLoading } = useMe();

  return (
    // z-[35]: 페이지 내부 sticky 요소(예: WeeklyScheduleGrid 헤더 z-30)보다는 위,
    // 전체화면 오버레이/모달(z-40 이상)보다는 아래에 둬서 알림 드롭다운이 항상 콘텐츠 위에 뜨게 함.
    <header className="bg-surface border-border fixed top-0 right-0 left-0 z-35 flex h-14 shrink-0 items-center justify-between border-b px-4">
      {/* 로고 — 데스크톱에서는 사이드바에 가려짐, 모바일에서만 표시 */}
      <Image
        src="/brand/bandage_wave_text_white.png"
        alt="Bandage"
        width={80}
        height={17}
        priority
        className="lg:invisible"
      />
      <div className="flex items-center gap-5">
        <NotificationBell collapsed placement="topbar" />
        {meLoading ? (
          <Skeleton rounded="pill" className="h-7 w-7 shrink-0" />
        ) : (
          <Link href={ROUTES.ME} aria-label="마이페이지" className="mr-4 inline-flex items-center">
            <Avatar
              src={me?.profileImg ?? undefined}
              fallback={me?.name ?? me?.email ?? '?'}
              className="h-7 w-7 text-xs"
            />
          </Link>
        )}
      </div>
    </header>
  );
}
