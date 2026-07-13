'use client';

import { Users } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useMyBands } from '../hooks/useMyBands';

import { BandCard } from './BandCard';

export function MyBands({ limit = 6 }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useMyBands(limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" rounded="md" />
        <Skeleton className="h-20 w-full" rounded="md" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="밴드 목록을 불러오지 못했습니다." onRetry={() => refetch()} />;
  }

  const bands = data ?? [];
  if (bands.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="가입한 밴드가 없습니다"
        description="밴드 탭에서 새 밴드를 만들거나 가입 신청을 해 보세요."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bands.map((b) => (
        <BandCard key={b.bandId} band={b} />
      ))}
    </div>
  );
}
