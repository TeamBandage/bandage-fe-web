'use client';

import { CalendarDays, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PerformanceCard } from '@/domain/performance/components/PerformanceCard';
import { usePerformanceList } from '@/domain/performance/hooks/usePerformanceList';
import { ROUTES } from '@/global/config/routes';

export function PerformancesList() {
  const searchParams = useSearchParams();
  const bandId = searchParams?.get('bandId') ?? undefined;

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePerformanceList(bandId, 20);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" rounded="md" />
        <Skeleton className="h-20 w-full" rounded="md" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="공연 목록을 불러오지 못했습니다." onRetry={() => refetch()} />;
  }

  const performances = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <div className="space-y-4">
      {bandId && (
        <p className="text-foreground-muted text-xs">
          밴드 필터 활성: <code className="text-foreground-sub">{bandId}</code>
        </p>
      )}

      {performances.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="등록된 공연이 없습니다"
          description="첫 번째 공연을 만들고 합주를 연결해 보세요."
        />
      ) : (
        <>
          <div className="space-y-3">
            {performances.map((p) => (
              <PerformanceCard key={p.performanceId} performance={p} />
            ))}
          </div>
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && <Skeleton className="h-20 w-full" rounded="md" />}
        </>
      )}

      <Link
        href={ROUTES.PERFORMANCE_NEW}
        aria-label="공연 만들기"
        className="bg-accent text-foreground hover:bg-accent-hi focus-visible:ring-accent focus-visible:ring-offset-bg rounded-pill fixed right-4 bottom-20 z-10 flex h-14 w-14 items-center justify-center shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
