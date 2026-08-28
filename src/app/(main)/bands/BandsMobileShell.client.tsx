'use client';

import { Root, Portal, Overlay, Content, Title, Close } from '@radix-ui/react-dialog';
import { ClipboardList, Maximize2, Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { MyItemMarker } from '@/components/ui/my-item-marker';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandCreateModal } from '@/domain/band/components/BandCreateModal.client';
import { BandRoleBadge } from '@/domain/band/components/BandRoleBadge';
import { MyBandApplicationsSheet } from '@/domain/band/components/MyBandApplicationsSheet.client';
import { useBandList } from '@/domain/band/hooks/useBandList';
import { useBandSearch } from '@/domain/band/hooks/useBandSearch';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/global/config/routes';

import { BandDetailContent } from './[bandId]/BandDetailContent.client';

function BandSelectRow({
  band,
  myRole,
  showMineMarker = false,
  isSelected = false,
  onClick,
}: {
  band: BandInfoResponse;
  myRole?: MyBandInfoResponse['myRole'];
  showMineMarker?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}) {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={band.profileImg || '/img/band_img.png'}
          alt={band.bandName}
          className="h-10 w-10 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="gap-s-2 flex items-center">
            <span className="text-caption truncate font-semibold">{band.bandName}</span>
            {myRole && <BandRoleBadge role={myRole} className="bg-white/10 text-white" />}
          </div>
          {band.description && (
            <p className="text-foreground-muted text-caption mt-0.5 truncate">{band.description}</p>
          )}
        </div>
        {showMineMarker && (
          <MyItemMarker label="내 밴드" className="text-micro bg-white/10 text-white" />
        )}
      </button>
    </li>
  );
}

export function BandsMobileShell() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  function handleExpand() {
    if (!selectedBandId) return;
    setSelectedBandId(null);
    router.push(ROUTES.BAND_DETAIL(selectedBandId));
  }

  const {
    data: myBandsData,
    isLoading: myLoading,
    fetchNextPage: fetchNextMyBands,
    hasNextPage: hasNextMyBands,
    isFetchingNextPage: isFetchingNextMyBands,
  } = useMyBands(50);
  const myBands = myBandsData?.pages.flatMap((p) => p.content) ?? [];

  const hasQuery = query.trim().length > 0;
  const {
    data: allBandsData,
    isLoading: allLoading,
    fetchNextPage: fetchNextAllBands,
    hasNextPage: hasNextAllBands,
    isFetchingNextPage: isFetchingNextAllBands,
  } = useBandList(20);
  const allBands = allBandsData?.pages.flatMap((p) => p.content) ?? [];
  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useBandSearch(query, 20);
  const searchResults = searchData?.pages.flatMap((p) => p.content) ?? [];

  const discoverBands = hasQuery ? searchResults : allBands;
  const discoverLoading = hasQuery ? searchLoading : allLoading;
  const fetchNextDiscover = hasQuery ? fetchNextSearch : fetchNextAllBands;
  const hasNextDiscover = hasQuery ? hasNextSearch : hasNextAllBands;
  const isFetchingNextDiscover = hasQuery ? isFetchingNextSearch : isFetchingNextAllBands;

  const discoverLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextDiscover,
    isFetchingNextPage: isFetchingNextDiscover,
    fetchNextPage: fetchNextDiscover,
  });

  const myBandsLoadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNextMyBands,
    isFetchingNextPage: isFetchingNextMyBands,
    fetchNextPage: fetchNextMyBands,
  });

  return (
    <>
      <Tabs defaultValue="mine" onValueChange={() => setQuery('')}>
        {/* 헤더 */}
        <div className="border-border mb-s-3 pb-s-2 pt-s-1 flex items-center justify-between border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">밴드</h2>
            {/* PC: 헤딩 바로 옆 토글 */}
            <TabsList className="hidden w-37.5 lg:inline-flex">
              <TabsTrigger
                value="mine"
                className="text-foreground flex-1 transition-all active:scale-95 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
              >
                내 밴드
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="text-foreground flex-1 transition-all active:scale-95 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
              >
                탐색
              </TabsTrigger>
            </TabsList>
            <MyBandApplicationsSheet
              trigger={
                <Button size="sm" variant="ghost" className="hidden lg:inline-flex">
                  나의 가입 신청
                </Button>
              }
            />
          </div>
          <BandCreateModal
            trigger={
              <Button
                size="sm"
                variant="accent-outline"
                aria-label="밴드 생성"
                className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
              >
                <Plus className="h-4 w-4" /> 밴드 생성
              </Button>
            }
          />
        </div>

        {/* 모바일: 헤더 아래 탭 + 가입 신청 내역 버튼 */}
        <div className="gap-s-2 mb-s-3 flex items-center lg:hidden">
          <TabsList className="flex-1">
            <TabsTrigger
              value="mine"
              className="text-foreground flex-1 transition-all active:scale-95 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
            >
              내 밴드
            </TabsTrigger>
            <TabsTrigger
              value="discover"
              className="text-foreground flex-1 transition-all active:scale-95 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
            >
              탐색
            </TabsTrigger>
          </TabsList>
          <MyBandApplicationsSheet
            trigger={
              <Button size="sm" variant="ghost" className="shrink-0" aria-label="나의 가입 신청">
                <ClipboardList className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <TabsContent value="mine">
          {myLoading ? (
            <div className="space-y-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          ) : myBands.length === 0 ? (
            <p className="text-foreground-muted py-s-6 text-center text-sm">
              참여 중인 밴드가 없습니다.
            </p>
          ) : (
            <>
              <ul className="gap-s-1 flex flex-col">
                {myBands.map((b) => (
                  <BandSelectRow
                    key={b.bandId}
                    band={b}
                    myRole={b.myRole}
                    isSelected={selectedBandId === b.bandId}
                    onClick={() => setSelectedBandId(b.bandId)}
                  />
                ))}
              </ul>
              {hasNextMyBands && (
                <div ref={myBandsLoadMoreRef} className="h-4" aria-hidden="true" />
              )}
              {isFetchingNextMyBands && (
                <div className="space-y-s-2 py-2">
                  <Skeleton className="h-14 w-full" rounded="md" />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="discover">
          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-[5px] border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="밴드명 검색"
              aria-label="밴드 검색"
              className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
            />
          </div>

          {discoverLoading ? (
            <div className="space-y-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          ) : discoverBands.length === 0 ? (
            <p className="text-foreground-muted py-s-6 text-center text-sm">
              {hasQuery ? '검색 결과가 없습니다.' : '등록된 밴드가 없습니다.'}
            </p>
          ) : (
            <>
              <ul className="gap-s-1 flex flex-col">
                {discoverBands.map((b) => {
                  const myEntry = myBands.find((mb) => mb.bandId === b.bandId);
                  return (
                    <BandSelectRow
                      key={b.bandId}
                      band={b}
                      myRole={myEntry?.myRole}
                      showMineMarker={!!myEntry}
                      isSelected={selectedBandId === b.bandId}
                      onClick={() => setSelectedBandId(b.bandId)}
                    />
                  );
                })}
              </ul>
              {hasNextDiscover && (
                <div ref={discoverLoadMoreRef} className="h-4" aria-hidden="true" />
              )}
              {isFetchingNextDiscover && (
                <div className="space-y-s-2 py-2">
                  <Skeleton className="h-14 w-full" rounded="md" />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {isDesktop ? (
        <Root open={!!selectedBandId} onOpenChange={(open) => !open && setSelectedBandId(null)}>
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
              <Title className="sr-only">밴드 상세</Title>
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
              <div className="flex-1 overflow-y-auto">
                {selectedBandId && <BandDetailContent bandId={selectedBandId} />}
              </div>
            </Content>
          </Portal>
        </Root>
      ) : (
        <BottomSheet
          open={!!selectedBandId}
          onOpenChange={(open) => !open && setSelectedBandId(null)}
        >
          <BottomSheetContent className="h-dvh">
            <BottomSheetTitle className="sr-only">밴드 상세</BottomSheetTitle>
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
            <div className="flex-1 overflow-y-auto">
              {selectedBandId && <BandDetailContent bandId={selectedBandId} />}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  );
}
