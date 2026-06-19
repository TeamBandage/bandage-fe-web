'use client';

import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';

import { ROUTES } from '@/global/config/routes';

import { JamsListPane } from './JamsListPane.client';

/**
 * /jams 영역 레이아웃.
 * - 기본: 좌측 ListPane(360px) + 우측 children (master-detail).
 * - /jams/new: 풀페이지 마법사 — ListPane 비노출, children 만 단일 패널로.
 */
export default function JamsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const isWizard = pathname === ROUTES.JAM_NEW || pathname.startsWith(`${ROUTES.JAM_NEW}/`);
  const isRoot = pathname === ROUTES.JAMS;

  if (isWizard) {
    return <div className="h-full overflow-y-auto">{children}</div>;
  }

  if (isRoot) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <JamsListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
