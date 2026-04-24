import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { Suspense } from 'react';

import { EmptyPane } from '@/components/feedback/empty-pane';
import { PageTitle } from '@/components/layout/page-title';
import { Skeleton } from '@/components/ui/skeleton';

import { PerformancesList } from './PerformancesList.client';

export const metadata: Metadata = {
  title: '공연 | Bandage',
};

export default function PerformancesPage() {
  return (
    <>
      <div className="space-y-s-6 p-s-4 lg:hidden">
        <PageTitle title="공연" description="예정된 공연 일정과 연결된 합주를 확인하세요." />
        <Suspense
          fallback={
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" rounded="md" />
              <Skeleton className="h-20 w-full" rounded="md" />
            </div>
          }
        >
          <PerformancesList />
        </Suspense>
      </div>
      <div className="hidden h-full lg:block">
        <EmptyPane
          icon={CalendarDays}
          title="공연을 선택해 주세요"
          description="왼쪽 목록에서 공연을 선택하면 상세 정보가 이곳에 표시됩니다."
        />
      </div>
    </>
  );
}
