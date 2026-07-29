'use client';

import { ListMusic, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import { useSetlistsByTitle } from '@/domain/setlist/hooks/useSetlistsByTitle';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';

export interface SetlistSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelection?: SetlistResponse[];
  onConfirm: (setlists: SetlistResponse[]) => void;
  /** 이미 연결되어 선택 대상에서 제외할 setlistId 목록 */
  excludeIds?: string[];
}

export function SetlistSelectorSheet({
  open,
  onOpenChange,
  initialSelection = [],
  onConfirm,
  excludeIds = [],
}: SetlistSelectorSheetProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMySetlists();
  const setlists = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.content) ?? []).filter(
        (s) => !excludeIds.includes(s.setlistId),
      ),
    [data, excludeIds],
  );
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const [selection, setSelection] = useState<SetlistResponse[]>(initialSelection);
  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSetlistsByTitle(query, { enabled: open });
  const searchResults = useMemo(
    () => (searchData ?? []).filter((s) => !excludeIds.includes(s.setlistId)),
    [searchData, excludeIds],
  );

  useEffect(() => {
    if (open) {
      setSelection(initialSelection);
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = hasQuery ? searchResults : setlists;
  const filteredLoading = hasQuery ? isSearchLoading : isLoading;
  const filteredError = hasQuery ? isSearchError : isError;

  function toggle(item: SetlistResponse) {
    setSelection((prev) =>
      prev.some((s) => s.setlistId === item.setlistId)
        ? prev.filter((s) => s.setlistId !== item.setlistId)
        : [...prev, item],
    );
  }

  function confirm() {
    onConfirm(selection);
    onOpenChange(false);
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader className="border-b-0 pb-2">
          <ResponsiveSheetTitle>셋리스트 선택</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <div className="border-border mx-5 border-b" />

        <ResponsiveSheetBody className="pt-2">
          <div className="border-border mx-5 mb-3 flex items-center gap-2 rounded-md border px-3 py-2">
            <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="셋리스트 검색"
              className="text-foreground placeholder:text-foreground-muted w-full bg-transparent text-sm outline-none"
            />
          </div>

          {filteredLoading && (
            <p className="text-foreground-muted text-caption px-5">불러오는 중...</p>
          )}
          {!filteredLoading && filteredError && (
            <p className="text-danger text-caption px-5">셋리스트를 불러오지 못했습니다.</p>
          )}
          {!filteredLoading && !filteredError && filtered.length === 0 && (
            <p className="text-foreground-sub px-5 text-sm">
              {hasQuery ? '검색 결과가 없습니다.' : '참여 중인 셋리스트가 없습니다.'}
            </p>
          )}
          {!filteredLoading && !filteredError && filtered.length > 0 && (
            <ul className="gap-s-2 flex max-h-[360px] flex-col overflow-y-auto px-5">
              {filtered.map((item) => {
                const sel = selection.some((s) => s.setlistId === item.setlistId);
                const date = (item.updatedAt ?? item.createdAt)?.slice(0, 10) ?? '';

                return (
                  <li key={item.setlistId}>
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      aria-pressed={sel}
                      className="w-full text-left"
                    >
                      <div
                        className={
                          'gap-s-3 px-s-4 py-s-3 flex items-center rounded-md border transition-colors ' +
                          (sel
                            ? 'border-white/60 bg-white/20'
                            : 'border-white/15 bg-white/8 hover:bg-white/12')
                        }
                      >
                        <span
                          className={
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ' +
                            (sel ? 'bg-white/30 text-white' : 'bg-white/15 text-white/80')
                          }
                        >
                          <ListMusic className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-body truncate font-semibold">{item.title}</p>
                          {date && (
                            <p className="text-foreground-muted" style={{ fontSize: 11 }}>
                              {date}
                            </p>
                          )}
                        </div>
                        {sel && (
                          <span className="text-caption rounded-full bg-white/20 px-2 py-0.5 text-white">
                            선택됨
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
              {!hasQuery && hasNextPage && (
                <li aria-hidden="true">
                  <div ref={loadMoreRef} className="h-4" />
                </li>
              )}
            </ul>
          )}
        </ResponsiveSheetBody>

        <ResponsiveSheetFooter className="border-t-0">
          <Button variant="ghost" className="h-8 rounded-[5px]" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={confirm}
            disabled={selection.length === 0}
            className="h-8 rounded-[5px] bg-white px-3 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30"
          >
            선택 ({selection.length})
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
