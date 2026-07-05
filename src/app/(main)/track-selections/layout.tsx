'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { ROUTES } from '@/global/config/routes';

import { SchedulingShell } from './scheduling/SchedulingShell.client';

/**
 * /track-selections 라우트 레이아웃.
 * - 기본: 목록/디테일 모두 일반 페이지로 렌더 (합주 목록과 동일한 패턴).
 * - /scheduling/*: SchedulingShell — scheduling 전용 마스터-디테일.
 * - /create (선곡 만들기 마법사): 풀페이지.
 */
export default function TrackSelectionsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const scheduling =
    pathname === ROUTES.TRACK_SELECTION_SCHEDULING ||
    pathname.startsWith(`${ROUTES.TRACK_SELECTION_SCHEDULING}/`);

  if (scheduling) {
    return <SchedulingShell>{children}</SchedulingShell>;
  }
  return <div className="h-full overflow-y-auto">{children}</div>;
}
