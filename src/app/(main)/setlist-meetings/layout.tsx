'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { ROUTES } from '@/global/config/routes';

import { SchedulingShell } from './scheduling/SchedulingShell.client';
import { SetlistMeetingsShell } from './SetlistMeetingsShell.client';

/**
 * /setlist-meetings 라우트 레이아웃.
 * - 기본: SetlistMeetingsShell (회의 목록 오버레이 + 디테일).
 * - /scheduling/*: SchedulingShell — scheduling 전용 마스터-디테일 (Task 1).
 * - /new (회의 만들기 마법사): 풀페이지 — Shell 우회.
 */
export default function SetlistMeetingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const fullPage =
    pathname === ROUTES.SETLIST_MEETING_NEW ||
    pathname.startsWith(`${ROUTES.SETLIST_MEETING_NEW}/`);
  const scheduling =
    pathname === ROUTES.SETLIST_SCHEDULING || pathname.startsWith(`${ROUTES.SETLIST_SCHEDULING}/`);

  if (fullPage) {
    return <div className="h-full overflow-y-auto">{children}</div>;
  }
  if (scheduling) {
    return <SchedulingShell>{children}</SchedulingShell>;
  }
  return <SetlistMeetingsShell>{children}</SetlistMeetingsShell>;
}
