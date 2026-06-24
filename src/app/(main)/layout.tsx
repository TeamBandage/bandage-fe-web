import { Suspense, type ReactNode } from 'react';

import { LeaveConfirmDialog } from '@/components/feedback/leave-confirm-dialog';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Container } from '@/components/layout/container';
import { GlobalTopbar } from '@/components/layout/global-topbar.client';
import { Shell } from '@/components/layout/shell';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthBootstrapper } from '@/global/auth/AuthBootstrapper.client';
import { DirtyFormProvider } from '@/global/navigation/dirty-form-context';

/**
 * (main) 레이아웃.
 * - lg (>=960px): Shell + Sidebar + 우측 column (children)
 * - lg 미만     : 기존 Container + BottomNav 구조 유지
 *
 * 두 변형 모두 동일한 children 을 받아 라우트 호환성을 보장합니다.
 * 실제 페이지(합주/밴드/공연) 의 master-detail 전환은 각 도메인 layout 에서 처리.
 *
 * Note: 데스크톱 main 영역은 좌측 Sidebar 와의 시각적 호흡을 위해
 * 페이지 단위 padding 대신 layout 에서 최소 좌우 패딩을 보장한다.
 * 도메인 라우트가 자체 layout(e.g. bands/layout.tsx) 로 master-detail 을 구성할 때는
 * 해당 layout 내부의 PaneDetail 이 padding 을 담당하고,
 * 이 main 의 padding 은 `children` 의 루트 div 가 자체 패딩을 지정한 경우에만 추가 작용한다.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthBootstrapper>
        <DirtyFormProvider>
          <GlobalTopbar />

          {/* Desktop */}
          <div className="hidden lg:block">
            <Shell>
              <Sidebar />
              <main className="flex flex-1 flex-col overflow-y-auto pt-14">{children}</main>
            </Shell>
          </div>

          {/* Mobile */}
          <div className="min-h-screen pt-14 pb-16 lg:hidden">
            <Container maxWidth="xl" padding className="py-s-6">
              {children}
            </Container>
            <BottomNav />
          </div>
          <LeaveConfirmDialog />
        </DirtyFormProvider>
      </AuthBootstrapper>
    </Suspense>
  );
}
