'use client';

import { Music, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PracticeCard } from '@/domain/practice/components/PracticeCard';
import { usePractices } from '@/domain/practice/hooks/usePractices';
import { ROUTES } from '@/global/config/routes';

export function PracticesList() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePractices(undefined, 20);

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
    return (
      <ErrorState
        description="합주 목록을 불러오지 못했습니다. 백엔드 목록 엔드포인트가 아직 제공되지 않을 수 있습니다."
        onRetry={() => refetch()}
      />
    );
  }

  const practices = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <div className="space-y-4">
      {practices.length === 0 ? (
        <EmptyState
          icon={Music}
          title="등록된 합주가 없습니다"
          description="첫 번째 합주를 만들어 세션을 편성해 보세요."
        />
      ) : (
        <>
          <div className="space-y-3">
            {practices.map((p) => (
              <PracticeCard key={p.practiceId} practice={p} />
            ))}
          </div>
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && <Skeleton className="h-20 w-full" rounded="md" />}
        </>
      )}

      <Link
        href={ROUTES.PRACTICE_NEW}
        aria-label="합주 만들기"
        className="bg-accent text-foreground hover:bg-accent-hi focus-visible:ring-accent focus-visible:ring-offset-bg rounded-pill fixed right-4 bottom-20 z-10 flex h-14 w-14 items-center justify-center shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
