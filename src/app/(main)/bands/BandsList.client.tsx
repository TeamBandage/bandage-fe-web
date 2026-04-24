'use client';

import { Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BandCard } from '@/domain/band/components/BandCard';
import { useBandList } from '@/domain/band/hooks/useBandList';
import { ROUTES } from '@/global/config/routes';

export function BandsList() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBandList(20);

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
        <Skeleton className="h-20 w-full" rounded="md" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="밴드 목록을 불러오지 못했습니다." onRetry={() => refetch()} />;
  }

  const bands = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <div className="space-y-4">
      {bands.length === 0 ? (
        <EmptyState
          icon={Users}
          title="아직 밴드가 없습니다"
          description="첫 번째 밴드를 만들어 보세요."
          action={{ label: '밴드 만들기', onClick: () => undefined }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {bands.map((b) => (
              <BandCard key={b.bandId} band={b} />
            ))}
          </div>
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && <Skeleton className="h-20 w-full" rounded="md" />}
        </>
      )}

      <Link
        href={ROUTES.BAND_NEW}
        aria-label="밴드 만들기"
        className="bg-accent text-foreground hover:bg-accent-hi focus-visible:ring-accent focus-visible:ring-offset-bg rounded-pill fixed right-4 bottom-20 z-10 flex h-14 w-14 items-center justify-center shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
