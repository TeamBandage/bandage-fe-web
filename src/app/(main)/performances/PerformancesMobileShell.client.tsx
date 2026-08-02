'use client';

import { Root, Portal, Overlay, Content, Title, Close } from '@radix-ui/react-dialog';
import { CalendarDays, MapPin, Maximize2, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceDday } from '@/domain/performance/components/PerformanceDday';
import { useMyPerformances } from '@/domain/performance/hooks/useMyPerformances';
import { usePerformanceList } from '@/domain/performance/hooks/usePerformanceList';
import { useSearchPerformances } from '@/domain/performance/hooks/useSearchPerformances';
import type { PerformanceListItemResponse } from '@/domain/performance/types';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';
import { formatKst, parseKst } from '@/lib/date';
import { DOMAIN_TONES } from '@/lib/domain-icons';
import { ROUTES } from '@/global/config/routes';

import { PerformanceDetailContent } from './[performanceId]/PerformanceDetailContent.client';
import { PerformancePosterStrip } from './PerformancePosterStrip.client';

function PerformanceSelectRow({
  performance,
  isSelected,
  onClick,
}: {
  performance: PerformanceListItemResponse;
  isSelected: boolean;
  onClick: () => void;
}) {
  let dateLabel = performance.startAt;
  try {
    dateLabel = formatKst(parseKst(performance.startAt), 'yy년 M월 d일 HH:mm');
  } catch {
    // keep raw
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'gap-s-3 px-s-3 py-s-3 flex w-full items-center rounded-[5px] text-left transition-colors',
          'hover:bg-surface-hi focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          isSelected ? 'border-l-[3px] border-l-white/60' : '',
        )}
      >
        <IconTile icon={<CalendarDays />} size="sm" tone={DOMAIN_TONES.performance} />
        <div className="min-w-0 flex-1">
          <div className="gap-s-1 flex items-center">
            <span className="text-caption truncate font-semibold">{performance.title}</span>
            <PerformanceDday startAt={performance.startAt} />
          </div>
          <div className="text-foreground-muted text-caption mt-0.5 flex items-center gap-2">
            <span className="truncate">{dateLabel}</span>
            {performance.venue && (
              <span className="inline-flex min-w-0 items-center gap-0.5">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{performance.venue}</span>
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

export function PerformancesMobileShell() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  function handleExpand() {
    if (!selectedId) return;
    setSelectedId(null);
    router.push(ROUTES.PERFORMANCE_DETAIL(selectedId));
  }

  const {
    data: myData,
    isLoading: myLoading,
    fetchNextPage: fetchNextMyPerformances,
    hasNextPage: hasNextMyPerformances,
    isFetchingNextPage: isFetchingNextMyPerformances,
  } = useMyPerformances(50);
  const myPerformances = myData?.pages.flatMap((p) => p.content) ?? [];
  const myPerformancesLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextMyPerformances,
    isFetchingNextPage: isFetchingNextMyPerformances,
    fetchNextPage: fetchNextMyPerformances,
  });

  const hasQuery = query.trim().length > 0;
  const {
    data: allData,
    isLoading: allLoading,
    fetchNextPage: fetchNextAllPerformances,
    hasNextPage: hasNextAllPerformances,
    isFetchingNextPage: isFetchingNextAllPerformances,
  } = usePerformanceList(undefined, 20);
  const allPerformances = allData?.pages.flatMap((p) => p.content) ?? [];
  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useSearchPerformances(query, 20);
  const searchResults = searchData?.pages.flatMap((p) => p.content) ?? [];

  const discoverList = hasQuery ? searchResults : allPerformances;
  const discoverLoading = hasQuery ? searchLoading : allLoading;
  const fetchNextDiscover = hasQuery ? fetchNextSearch : fetchNextAllPerformances;
  const hasNextDiscover = hasQuery ? hasNextSearch : hasNextAllPerformances;
  const isFetchingNextDiscover = hasQuery ? isFetchingNextSearch : isFetchingNextAllPerformances;
  const discoverLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextDiscover,
    isFetchingNextPage: isFetchingNextDiscover,
    fetchNextPage: fetchNextDiscover,
  });

  const panelContent = selectedId ? (
    <div className="pb-6">
      <PerformanceDetailContent performanceId={selectedId} onDeleted={() => setSelectedId(null)} />
    </div>
  ) : null;

  const tabTriggerCls =
    'text-foreground flex-1 transition-all active:scale-95 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900';

  return (
    <>
      <Tabs defaultValue="mine" onValueChange={() => setQuery('')}>
        {/* 헤더 */}
        <div className="border-border mb-s-3 pb-s-2 pt-s-1 flex items-center justify-between border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">공연</h2>
            <TabsList className="hidden w-37.5 lg:inline-flex">
              <TabsTrigger value="mine" className={tabTriggerCls}>
                내 공연
              </TabsTrigger>
              <TabsTrigger value="discover" className={tabTriggerCls}>
                탐색
              </TabsTrigger>
            </TabsList>
          </div>
          <Button
            asChild
            size="sm"
            variant="accent-outline"
            className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
          >
            <Link href={ROUTES.PERFORMANCE_CREATE}>
              <Plus className="h-4 w-4" /> 공연 생성
            </Link>
          </Button>
        </div>

        {/* 모바일 탭 */}
        <div className="mb-s-3 lg:hidden">
          <TabsList className="w-full">
            <TabsTrigger value="mine" className={tabTriggerCls}>
              내 공연
            </TabsTrigger>
            <TabsTrigger value="discover" className={tabTriggerCls}>
              탐색
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mine">
          {myLoading ? (
            <div className="space-y-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          ) : myPerformances.length === 0 ? (
            <p className="text-foreground-muted py-s-6 text-center text-sm">
              예정된 공연이 없습니다.
            </p>
          ) : (
            <>
              <ul className="gap-s-1 flex flex-col">
                {myPerformances.map((p) => (
                  <PerformanceSelectRow
                    key={p.performanceId}
                    performance={p}
                    isSelected={selectedId === p.performanceId}
                    onClick={() => setSelectedId(p.performanceId)}
                  />
                ))}
              </ul>
              {hasNextMyPerformances && (
                <div ref={myPerformancesLoadMoreRef} className="h-4" aria-hidden="true" />
              )}
              {isFetchingNextMyPerformances && (
                <div className="space-y-s-2 mt-s-2">
                  <Skeleton className="h-14 w-full" rounded="md" />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="discover">
          <div className="mb-s-3">
            <PerformancePosterStrip />
          </div>

          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-[5px] border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공연명 검색"
              aria-label="공연 검색"
              className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
            />
          </div>

          {discoverLoading ? (
            <div className="space-y-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          ) : discoverList.length === 0 ? (
            <p className="text-foreground-muted py-s-6 text-center text-sm">
              {hasQuery ? '검색 결과가 없습니다.' : '등록된 공연이 없습니다.'}
            </p>
          ) : (
            <>
              <ul className="gap-s-1 flex flex-col">
                {discoverList.map((p) => (
                  <PerformanceSelectRow
                    key={p.performanceId}
                    performance={p}
                    isSelected={selectedId === p.performanceId}
                    onClick={() => setSelectedId(p.performanceId)}
                  />
                ))}
              </ul>
              {hasNextDiscover && (
                <div ref={discoverLoadMoreRef} className="h-4" aria-hidden="true" />
              )}
              {isFetchingNextDiscover && (
                <div className="space-y-s-2 mt-s-2">
                  <Skeleton className="h-14 w-full" rounded="md" />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {isDesktop ? (
        <Root open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <Portal>
            <Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/60 data-[state=closed]:opacity-0" />
            <Content
              className={cn(
                'bg-card text-foreground border-border',
                'fixed inset-y-0 right-0 z-50 flex w-140 flex-col border-l shadow-lg outline-none',
                'animate-[slide-in-right_var(--duration-normal)_var(--ease-default)]',
                'data-[state=closed]:animate-[slide-out-right_var(--duration-normal)_var(--ease-default)]',
              )}
            >
              <Title className="sr-only">공연 상세</Title>
              <div className="flex shrink-0 items-center justify-between px-4 py-5">
                <button
                  type="button"
                  onClick={handleExpand}
                  aria-label="전체 화면으로 보기"
                  className="text-foreground-sub hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <Close
                  aria-label="닫기"
                  className="text-foreground-sub hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-bg rounded-sm p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <X className="h-4 w-4" />
                </Close>
              </div>
              <div className="flex-1 overflow-y-auto">{panelContent}</div>
            </Content>
          </Portal>
        </Root>
      ) : (
        <BottomSheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <BottomSheetContent className="h-dvh">
            <BottomSheetTitle className="sr-only">공연 상세</BottomSheetTitle>
            <div className="flex shrink-0 items-center px-4 py-3">
              <button
                type="button"
                onClick={handleExpand}
                aria-label="전체 화면으로 보기"
                className="text-foreground-sub hover:text-foreground rounded-sm p-1 transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{panelContent}</div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  );
}
