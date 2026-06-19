'use client';

import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { MyItemMarker, myItemBorder } from '@/components/ui/my-item-marker';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandCreateModal } from '@/domain/band/components/BandCreateModal.client';
import { BandRoleBadge } from '@/domain/band/components/BandRoleBadge';
import { useBandList } from '@/domain/band/hooks/useBandList';
import { useBandSearch } from '@/domain/band/hooks/useBandSearch';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { cn } from '@/lib/cn';
import { DOMAIN_ICONS, DOMAIN_TONES } from '@/lib/domain-icons';

import { BandDetailContent } from './[bandId]/BandDetailContent.client';

const BandIcon = DOMAIN_ICONS.band;

function BandSelectRow({
  band,
  myRole,
  showMineMarker = false,
  onClick,
}: {
  band: BandInfoResponse;
  myRole?: MyBandInfoResponse['myRole'];
  showMineMarker?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'gap-s-3 px-s-3 py-s-3 flex w-full items-center rounded-md text-left transition-colors',
          'hover:bg-surface-hi focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          myItemBorder(showMineMarker),
        )}
      >
        <IconTile icon={<BandIcon />} size="sm" tone={DOMAIN_TONES.band} />
        <div className="min-w-0 flex-1">
          <div className="gap-s-2 flex items-center">
            <span className="text-caption truncate font-semibold">{band.bandName}</span>
            {myRole && <BandRoleBadge role={myRole} />}
          </div>
          {band.description && (
            <p className="text-foreground-muted text-caption mt-0.5 truncate">{band.description}</p>
          )}
        </div>
        {showMineMarker && <MyItemMarker label="내 밴드" />}
      </button>
    </li>
  );
}

export function BandsMobileShell() {
  const [query, setQuery] = useState('');
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);

  const { data: myBandsData, isLoading: myLoading } = useMyBands(50);
  const myBands = myBandsData ?? [];

  // 탐색 탭: 기본 전체 목록 / 검색어 있으면 API 검색으로 전환
  const hasQuery = query.trim().length > 0;
  const { data: allBandsData, isLoading: allLoading } = useBandList(20);
  const allBands = allBandsData?.pages.flatMap((p) => p.content) ?? [];
  const { data: searchData, isLoading: searchLoading } = useBandSearch(query, 20);
  const searchResults = searchData?.pages.flatMap((p) => p.content) ?? [];

  const discoverBands = hasQuery ? searchResults : allBands;
  const discoverLoading = hasQuery ? searchLoading : allLoading;

  return (
    <>
      <div className="border-border mb-s-3 pb-s-3 flex items-center justify-between border-b">
        <h2 className="text-body font-bold">밴드 탐색</h2>
        <BandCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="밴드 생성">
              <Plus className="h-4 w-4" /> 밴드 생성
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="mine" onValueChange={() => setQuery('')}>
        <div className="mb-s-3">
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1">
              내 밴드
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex-1">
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
                  onClick={() => setSelectedBandId(b.bandId)}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="discover">
          <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-md border">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="밴드 이름·소개 검색…"
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
                    onClick={() => setSelectedBandId(b.bandId)}
                  />
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

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
    </>
  );
}
