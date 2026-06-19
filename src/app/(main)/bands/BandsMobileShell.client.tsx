'use client';

import { Root, Portal, Overlay, Content, Title, Close } from '@radix-ui/react-dialog';
import { Plus, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { MyItemMarker } from '@/components/ui/my-item-marker';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandCreateModal } from '@/domain/band/components/BandCreateModal.client';
import { BandRoleBadge } from '@/domain/band/components/BandRoleBadge';
import { useBandList } from '@/domain/band/hooks/useBandList';
import { useBandSearch } from '@/domain/band/hooks/useBandSearch';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';
import { DOMAIN_TONES } from '@/lib/domain-icons';

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
        {band.profileImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={band.profileImg}
            alt={band.bandName}
            className="h-10 w-10 shrink-0 rounded-md object-cover"
          />
        ) : (
          <IconTile icon={<Users />} size="sm" tone={DOMAIN_TONES.band} />
        )}
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
  const [query, setQuery] = useState('');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const { data: myBandsData, isLoading: myLoading } = useMyBands(50);
  const myBands = myBandsData ?? [];

  const hasQuery = query.trim().length > 0;
  const { data: allBandsData, isLoading: allLoading } = useBandList(20);
  const allBands = allBandsData?.pages.flatMap((p) => p.content) ?? [];
  const { data: searchData, isLoading: searchLoading } = useBandSearch(query, 20);
  const searchResults = searchData?.pages.flatMap((p) => p.content) ?? [];

  const discoverBands = hasQuery ? searchResults : allBands;
  const discoverLoading = hasQuery ? searchLoading : allLoading;

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

        {/* 모바일: 헤더 아래 풀너비 토글 */}
        <div className="mb-s-3 lg:hidden">
          <TabsList className="w-full">
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
                'fixed inset-y-0 right-0 z-50 flex w-105 flex-col border-l shadow-lg outline-none',
                'animate-[slide-in-right_var(--duration-normal)_var(--ease-default)]',
                'data-[state=closed]:animate-[slide-out-right_var(--duration-normal)_var(--ease-default)]',
              )}
            >
              <Title className="sr-only">밴드 상세</Title>
              <div className="flex shrink-0 items-center justify-end px-4 py-3">
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
          <BottomSheetContent>
            <BottomSheetTitle className="sr-only">밴드 상세</BottomSheetTitle>
            <div className="flex-1 overflow-y-auto">
              {selectedBandId && <BandDetailContent bandId={selectedBandId} />}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  );
}
