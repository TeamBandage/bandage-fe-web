'use client';

import { Search } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import type { CursorResponse } from '@/global/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';

import { Button } from './button';
import { Skeleton } from './skeleton';

export interface EntityPickerModalProps<T, C = never> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 검색 input placeholder. */
  placeholder?: string;
  /** 다중 선택 여부. false 면 단일 선택, true 면 체크박스 다중. */
  multiple?: boolean;
  /** 검색어 → 결과 배열 fetcher. trimmed keyword 가 빈 문자열이면 호출되지 않음.
   * paginatedFetcher 와 배타적 — paginatedFetcher 가 있으면 이건 무시된다. */
  fetcher?: (keyword: string) => Promise<T[]>;
  /** 커서 기반 페이지네이션 fetcher. 지정하면 fetcher 대신 이걸 쓰고 무한스크롤이 활성화된다. */
  paginatedFetcher?: (params: {
    keyword: string;
    lastId?: C;
    pageSize: number;
  }) => Promise<CursorResponse<T, C>>;
  /** paginatedFetcher 사용 시 페이지 크기. 기본 20. */
  pageSize?: number;
  /** 항목의 안정 식별자 추출. */
  getKey: (item: T) => string;
  /** 결과 카드 렌더. selected 는 현재 모달 내부 선택 상태. */
  renderItem: (item: T, selected: boolean) => ReactNode;
  /** 확인 시 호출. multiple=true 면 배열, false 면 단일 항목. */
  onConfirm: (selection: T[]) => void;
  /** 디바운스 ms. 기본 250. */
  debounceMs?: number;
  /** 사전 선택값 (수정 모드 등). */
  initialSelection?: T[];
  /** 확인 버튼에 추가할 className (스타일 커스텀용). */
  confirmButtonClassName?: string;
  /** 취소 버튼에 추가할 className (스타일 커스텀용). */
  cancelButtonClassName?: string;
  /** 푸터 영역에 추가할 className (스타일 커스텀용). */
  footerClassName?: string;
}

/**
 * 도메인 횡단 검색 + 선택 모달.
 * - keyword input → 디바운스 → fetcher 호출
 * - 결과 카드 리스트 (renderItem 주입)
 * - 다중/단일 선택 토글
 * - 확인 시 onConfirm 호출, 취소/오버레이 시 onOpenChange(false)
 *
 * 사용 예: BandPickerModal, MemberPickerModal, PracticePickerModal
 *
 * 열릴 때마다 내부 검색 상태(query/debounce/결과)를 완전히 새로 마운트해 리셋한다.
 * useEffect 리셋만으로는 debounce 값이 새 open 시점까지 이전 검색어를 들고 있어
 * 이전 결과가 잠깐 다시 보이는 현상이 생기므로, key 를 바꿔 통째로 재마운트한다.
 */
export function EntityPickerModal<T, C = never>(props: EntityPickerModalProps<T, C>) {
  const { open } = props;
  const [prevOpen, setPrevOpen] = useState(open);
  const [sessionId, setSessionId] = useState(0);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSessionId((id) => id + 1);
  }

  return (
    <ResponsiveSheet open={props.open} onOpenChange={props.onOpenChange}>
      <ResponsiveSheetContent>
        <EntityPickerModalBody key={sessionId} {...props} />
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function EntityPickerModalBody<T, C>({
  open,
  onOpenChange,
  title,
  placeholder = '검색어를 입력하세요',
  multiple = false,
  fetcher,
  paginatedFetcher,
  pageSize = 20,
  getKey,
  renderItem,
  onConfirm,
  debounceMs = 250,
  initialSelection = [],
  confirmButtonClassName,
  cancelButtonClassName,
  footerClassName,
}: EntityPickerModalProps<T, C>) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, debounceMs);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<T[]>(initialSelection);
  const [nextCursor, setNextCursor] = useState<C | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 검색(첫 페이지). paginatedFetcher 가 있으면 그걸 우선 사용 — 커서/hasNext 상태도 같이 갱신.
  useEffect(() => {
    const trimmed = debounced.trim();
    if (!open || !trimmed) {
      setResults([]);
      setHasNext(false);
      setNextCursor(undefined);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const request = paginatedFetcher
      ? paginatedFetcher({ keyword: trimmed, pageSize }).then((page) => {
          if (cancelled) return;
          setResults(page.content);
          setHasNext(page.hasNext);
          setNextCursor(page.nextCursor ?? undefined);
        })
      : (fetcher?.(trimmed) ?? Promise.resolve([])).then((data) => {
          if (cancelled) return;
          setResults(data);
          setHasNext(false);
          setNextCursor(undefined);
        });
    request
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '검색에 실패했습니다.');
          setResults([]);
          setHasNext(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, fetcher, paginatedFetcher, pageSize]);

  // 다음 페이지 로드(paginatedFetcher 전용) — 결과에 누적.
  const loadMore = useCallback(() => {
    if (!paginatedFetcher || loadingMore || !hasNext) return;
    const trimmed = debounced.trim();
    if (!trimmed) return;
    setLoadingMore(true);
    paginatedFetcher({ keyword: trimmed, lastId: nextCursor, pageSize })
      .then((page) => {
        setResults((prev) => [...prev, ...page.content]);
        setHasNext(page.hasNext);
        setNextCursor(page.nextCursor ?? undefined);
      })
      .catch(() => {
        setHasNext(false);
      })
      .finally(() => setLoadingMore(false));
  }, [paginatedFetcher, loadingMore, hasNext, debounced, nextCursor, pageSize]);

  const loadMoreRef = useInfiniteScrollSentinel({
    hasNextPage: hasNext,
    isFetchingNextPage: loadingMore,
    fetchNextPage: loadMore,
  });

  function toggle(item: T) {
    const k = getKey(item);
    setSelection((prev) => {
      const exists = prev.some((p) => getKey(p) === k);
      if (multiple) {
        return exists ? prev.filter((p) => getKey(p) !== k) : [...prev, item];
      }
      return exists ? [] : [item];
    });
  }

  function confirm() {
    onConfirm(selection);
    onOpenChange(false);
  }

  return (
    <>
      <ResponsiveSheetHeader>
        <ResponsiveSheetTitle>{title}</ResponsiveSheetTitle>
      </ResponsiveSheetHeader>
      <ResponsiveSheetBody>
        <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-md border">
          <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
            aria-label={`${title} 검색`}
          />
        </div>
        <div
          className="max-h-[420px] overflow-y-auto"
          data-slot="entity-picker-results"
          aria-busy={loading}
        >
          {!debounced.trim() ? null : loading ? (
            <p className="text-foreground-muted p-s-4 text-caption">검색 중…</p>
          ) : error ? (
            <p className="text-foreground-muted p-s-4 text-caption">{error}</p>
          ) : results.length === 0 ? (
            <p className="text-foreground-muted p-s-4 text-caption">검색 결과가 없습니다.</p>
          ) : (
            <ul className="gap-s-2 flex flex-col">
              {results.map((item) => {
                const k = getKey(item);
                const sel = selection.some((s) => getKey(s) === k);
                return (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      aria-pressed={sel}
                      className="w-full text-left"
                    >
                      {renderItem(item, sel)}
                    </button>
                  </li>
                );
              })}
              {hasNext && (
                <li aria-hidden="true">
                  <div ref={loadMoreRef} className="h-4" />
                </li>
              )}
              {loadingMore && (
                <li>
                  <Skeleton className="h-12 w-full" rounded="md" />
                </li>
              )}
            </ul>
          )}
        </div>
      </ResponsiveSheetBody>
      <ResponsiveSheetFooter className={cn(footerClassName)}>
        <Button
          variant="ghost"
          className={cn(cancelButtonClassName)}
          onClick={() => onOpenChange(false)}
        >
          취소
        </Button>
        <Button
          onClick={confirm}
          disabled={selection.length === 0}
          className={cn(confirmButtonClassName)}
        >
          {multiple ? `선택 (${selection.length})` : '확인'}
        </Button>
      </ResponsiveSheetFooter>
    </>
  );
}
