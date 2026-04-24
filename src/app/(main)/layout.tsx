import type { ReactNode } from 'react';

import { BottomNav } from '@/components/layout/bottom-nav';
import { Container } from '@/components/layout/container';
import { Shell } from '@/components/layout/shell';
import { Sidebar } from '@/components/layout/sidebar';

/**
 * (main) 레이아웃.
 * - lg (>=960px): Shell + Sidebar + 우측 column (children)
 * - lg 미만     : 기존 Container + BottomNav 구조 유지
 *
 * 두 변형 모두 동일한 children 을 받아 라우트 호환성을 보장합니다.
 * 실제 페이지(합주/밴드/공연) 의 master-detail 전환은 각 도메인 layout 에서 처리.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <Shell>
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
        </Shell>
      </div>

      {/* Mobile */}
      <div className="min-h-screen pb-16 lg:hidden">
        <Container maxWidth="xl" padding className="py-6">
          {children}
        </Container>
        <BottomNav />
      </div>
    </>
  );
}
