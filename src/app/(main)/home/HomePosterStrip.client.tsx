'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAllPerformancePosters } from '@/domain/performance-poster/hooks/useAllPerformancePosters';
import type { PerformancePosterResponse } from '@/domain/performance-poster/types/res';
import { usePerformanceDetail } from '@/domain/performance/hooks/usePerformanceDetail';
import { ROUTES } from '@/global/config/routes';

const SCROLL_STEP = 240;

function HomePosterCard({ poster }: { poster: PerformancePosterResponse }) {
  const { data: performance } = usePerformanceDetail(poster.performanceId);

  return (
    <Link
      href={ROUTES.PERFORMANCE_DETAIL(poster.performanceId)}
      className="flex w-56 shrink-0 flex-col gap-2 no-underline"
    >
      <div className="border-border h-80 w-56 shrink-0 overflow-hidden border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster.imageUrl}
          alt={poster.description ?? '공연 포스터'}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="text-foreground-muted truncate text-center text-sm font-medium">
        {performance?.title ?? ''}
      </p>
    </Link>
  );
}

export function HomePosterStrip() {
  const { data: posters = [], isLoading } = useAllPerformancePosters();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, [posters]);

  const scrollByStep = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-56 shrink-0 rounded-none" />
        ))}
      </div>
    );
  }

  if (posters.length === 0) return null;

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          aria-label="이전 포스터"
          className="border-border bg-bg/80 text-foreground absolute top-40 left-0 z-10 -translate-y-1/2 rounded-full border p-1.5 backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="gap-s-3 -mx-s-5 px-s-5 scrollbar-hide flex overflow-x-auto pb-1 lg:mx-0 lg:px-0"
      >
        {posters.map((poster) => (
          <HomePosterCard key={poster.posterId} poster={poster} />
        ))}
      </div>
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByStep(1)}
          aria-label="다음 포스터"
          className="border-border bg-bg/80 text-foreground absolute top-40 right-0 z-10 -translate-y-1/2 rounded-full border p-1.5 backdrop-blur"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
