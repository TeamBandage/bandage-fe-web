'use client';

import { CalendarDays } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { pickUpcoming } from '@/lib/home-feed';

import { useUpcomingPerformances } from '../hooks/useUpcomingPerformances';
import type { PerformanceListItemResponse } from '../types';

import { PerformanceCard } from './PerformanceCard';

// [BD-90] MOCK_MODE — UI 확인용, 실제 연동 후 제거
const MOCK_MODE = true;
const MOCK_PERFORMANCES: PerformanceListItemResponse[] = [
  {
    performanceId: '1',
    title: '2026 여름 인디 페스트',
    startAt: '2026-07-05 18:00',
    durationMinutes: 90,
    venue: '홍대 롤링홀',
  },
  {
    performanceId: '2',
    title: '밴드 정기 공연',
    startAt: '2026-08-20 19:30',
    durationMinutes: 120,
    venue: '강남 클럽 에반스',
  },
];

export function UpcomingPerformances({ limit = 3 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useUpcomingPerformances(limit + 1);

  if (MOCK_MODE) {
    return (
      <div className="space-y-3">
        {MOCK_PERFORMANCES.slice(0, limit).map((p) => (
          <PerformanceCard key={p.performanceId} performance={p} />
        ))}
      </div>
    );
  }

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

  const { items } = pickUpcoming(data ?? [], limit);
  if (items.length === 0) {
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
      {items.map((p) => (
        <PerformanceCard key={p.performanceId} performance={p} />
      ))}
    </div>
  );
}
