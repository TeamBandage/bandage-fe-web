'use client';

import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { ROUTES } from '@/global/config/routes';

import { PracticesListPane } from './PracticesListPane.client';

/**
 * /practices 영역 레이아웃.
 * - 기본: 좌측 ListPane(360px) + 우측 children (master-detail).
 * - /practices/new: 풀페이지 마법사 — ListPane 비노출, children 만 단일 패널로.
 */
export default function PracticesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const fullPage =
    pathname === ROUTES.PRACTICE_NEW || pathname.startsWith(`${ROUTES.PRACTICE_NEW}/`);

  if (fullPage) {
    return <div className="h-full overflow-y-auto">{children}</div>;
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <PracticesListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
