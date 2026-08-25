'use client';

import { Root, Portal, Overlay, Content, Title, Close } from '@radix-ui/react-dialog';
import { Maximize2, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { JamDday } from '@/domain/jam/components/JamDday';
import { useMyJams } from '@/domain/jam/hooks/useMyJams';
import { useSearchMyJams } from '@/domain/jam/hooks/useSearchMyJams';
import type { JamListItemResponse } from '@/domain/jam/types';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';
import { useRouter } from 'next/navigation';
import { formatKst, parseKst } from '@/lib/date';
import { DOMAIN_ICONS, DOMAIN_TONES } from '@/lib/domain-icons';

import { JamDetailContent } from './[jamId]/JamDetailContent.client';

const PracticeIcon = DOMAIN_ICONS.practice;

function PracticeSelectRow({
  practice,
  isSelected,
  onClick,
}: {
  practice: JamListItemResponse;
  isSelected: boolean;
  onClick: () => void;
}) {
  const when = formatKst(parseKst(practice.startAt), 'yy년 M월 d일 HH:mm');
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'gap-s-3 px-s-3 py-s-3 flex w-full items-center rounded-[5px] text-left transition-colors',
          'hover:bg-surface-hi focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          isSelected && 'border-l-[3px] border-l-white/60',
        )}
      >
        <IconTile icon={<PracticeIcon />} size="sm" tone={DOMAIN_TONES.practice} />
        <div className="min-w-0 flex-1">
          <div className="gap-s-1 flex items-center">
            <span className="text-caption truncate font-semibold">{practice.title}</span>
            <JamDday startAt={practice.startAt} />
          </div>
          <div className="text-foreground-muted text-caption gap-s-2 mt-0.5 flex items-center">
            <span>{when}</span>
            {practice.venue && <span className="truncate">· {practice.venue}</span>}
          </div>
        </div>
      </button>
    </li>
  );
}

export function JamsMobileShell() {
  const router = useRouter();
  const [selectedJamId, setSelectedPracticeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const isDesktop = useIsDesktop();

  function handleExpand() {
    if (!selectedJamId) return;
    setSelectedPracticeId(null);
    router.push(ROUTES.JAM_DETAIL(selectedJamId));
  }

  const isSearching = query.trim().length > 0;

  const {
    data: myData,
    isLoading: myLoading,
    fetchNextPage: fetchNextMyJams,
    hasNextPage: hasNextMyJams,
    isFetchingNextPage: isFetchingNextMyJams,
  } = useMyJams(20);
  const myJams = myData?.pages.flatMap((p) => p.content) ?? [];

  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage: fetchNextSearchJams,
    hasNextPage: hasNextSearchJams,
    isFetchingNextPage: isFetchingNextSearchJams,
  } = useSearchMyJams(query, 20);
  const searchJams = searchData?.pages.flatMap((p) => p.content) ?? [];

  const jams = isSearching ? searchJams : myJams;
  const isLoading = isSearching ? searchLoading : myLoading;
  const hasNextPage = isSearching ? hasNextSearchJams : hasNextMyJams;
  const isFetchingNextPage = isSearching ? isFetchingNextSearchJams : isFetchingNextMyJams;
  const fetchNextPage = isSearching ? fetchNextSearchJams : fetchNextMyJams;
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  return (
    <>
      <div className="border-border mb-s-3 pb-s-2 pt-s-1 flex items-center justify-between border-b">
        <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">내 합주</h2>
        <Button
          asChild
          size="sm"
          variant="accent-outline"
          aria-label="합주 생성"
          className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
        >
          <Link href={ROUTES.JAM_CREATE}>
            <Plus className="h-4 w-4" /> 합주 생성
          </Link>
        </Button>
      </div>

      <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-[5px] border">
        <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목·곡 검색…"
          aria-label="내 합주 검색"
          className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : jams.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          {isSearching ? '검색 결과가 없습니다.' : '예정된 합주가 없습니다.'}
        </p>
      ) : (
        <ul className="gap-s-1 flex flex-col">
          {jams.map((p) => (
            <PracticeSelectRow
              key={p.jamId}
              practice={p}
              isSelected={selectedJamId === p.jamId}
              onClick={() => setSelectedPracticeId(p.jamId)}
            />
          ))}
          {hasNextPage && (
            <li aria-hidden="true">
              <div ref={loadMoreRef} className="h-4" />
            </li>
          )}
          {isFetchingNextPage && (
            <li>
              <Skeleton className="h-14 w-full" rounded="md" />
            </li>
          )}
        </ul>
      )}

      {isDesktop ? (
        <Root open={!!selectedJamId} onOpenChange={(open) => !open && setSelectedPracticeId(null)}>
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
              <Title className="sr-only">합주 상세</Title>
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
              <div className="flex-1 overflow-y-auto p-6">
                {selectedJamId && (
                  <JamDetailContent
                    jamId={selectedJamId}
                    onAfterDelete={() => setSelectedPracticeId(null)}
                  />
                )}
              </div>
            </Content>
          </Portal>
        </Root>
      ) : (
        <BottomSheet
          open={!!selectedJamId}
          onOpenChange={(open) => !open && setSelectedPracticeId(null)}
        >
          <BottomSheetContent className="h-dvh">
            <BottomSheetTitle className="sr-only">합주 상세</BottomSheetTitle>
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
            <div className="flex-1 overflow-y-auto p-4">
              {selectedJamId && (
                <JamDetailContent
                  jamId={selectedJamId}
                  onAfterDelete={() => setSelectedPracticeId(null)}
                />
              )}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </>
  );
}
