'use client';

import { CalendarDays } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useUpcomingPerformances } from '../hooks/useUpcomingPerformances';

import { PerformanceCard } from './PerformanceCard';

export function UpcomingPerformances({ limit = 2 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useUpcomingPerformances(limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" rounded="md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="예정 공연을 불러오지 못했습니다." onRetry={() => refetch()} />;
  }

  const performances = data ?? [];
  if (performances.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="예정된 공연이 없습니다"
        description="공연 탭에서 새 공연을 추가해 보세요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {performances.map((p) => (
        <PerformanceCard key={p.performanceId} performance={p} />
      ))}
    </div>
  );
}
