'use client';

import { Music } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useUpcomingPractices } from '../hooks/useUpcomingPractices';

import { PracticeCard } from './PracticeCard';

export function UpcomingPractices({ limit = 3 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useUpcomingPractices(limit);

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
    return (
      <ErrorState description="가까운 합주를 불러오지 못했습니다." onRetry={() => refetch()} />
    );
  }

  const practices = data ?? [];
  if (practices.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="예정된 합주가 없습니다"
        description="합주 탭에서 첫 합주를 만들어 보세요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {practices.map((p) => (
        <PracticeCard key={p.practiceId} practice={p} />
      ))}
    </div>
  );
}
