import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageTitle } from '@/components/layout/page-title';
import { Skeleton } from '@/components/ui/skeleton';

import { PerformancesList } from './PerformancesList.client';

export const metadata: Metadata = {
  title: '공연 | Bandage',
};

export default function PerformancesPage() {
  return (
    <div className="space-y-6">
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
  );
}
