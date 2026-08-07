'use client';

import { ListMusic, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';
import { useDeleteSetlist } from '@/domain/setlist/hooks/useDeleteSetlist';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import { useSetlistsByTitle } from '@/domain/setlist/hooks/useSetlistsByTitle';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { listItemClasses } from '@/lib/list-item-styles';

function SetlistRow({
  item,
  active,
  isManager,
  onDeleteClick,
}: {
  item: SetlistResponse;
  active: boolean;
  isManager: boolean;
  onDeleteClick: () => void;
}) {
  const href = ROUTES.SETLIST_DETAIL(item.setlistId);

  return (
    <li>
      <div
        className={listItemClasses(
          active,
          'accent',
          cn(
            'text-foreground items-center',
            active && 'border-white/25 bg-white/10 hover:bg-white/10',
          ),
        )}
      >
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          data-slot="setlist-row"
          className="gap-s-3 focus-visible:ring-offset-bg flex min-w-0 flex-1 items-center text-inherit no-underline focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
            <ListMusic className="h-4 w-4" />
          </span>
          <div className="gap-s-2 flex min-w-0 flex-1 items-center">
            <span className="text-caption truncate font-semibold">{item.title}</span>
            {isManager && (
              <Badge variant="amber" className="bg-white/10 text-white">
                매니저
              </Badge>
            )}
          </div>
        </Link>
        {isManager && (
          <button
            type="button"
            onClick={onDeleteClick}
            aria-label={`${item.title} 삭제`}
            className="text-foreground-muted hover:text-danger shrink-0 rounded p-1.5 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export function SetlistsMobileShell() {
  const pathname = usePathname() ?? '';
  const isDesktop = useIsDesktop();
  const { data: me } = useMe();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;

  const [deletingSetlist, setDeletingSetlist] = useState<SetlistResponse | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMySetlists();
  const mySetlists = data?.pages.flatMap((p) => p.content) ?? [];
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSetlistsByTitle(query);

  const setlists = hasQuery ? (searchData ?? []) : mySetlists;
  const setlistsLoading = hasQuery ? isSearchLoading : isLoading;

  const deleteMutation = useDeleteSetlist();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setDeletingSetlist(null);
      setConfirmText('');
    }
  }

  function handleDelete() {
    if (!deletingSetlist) return;
    deleteMutation.mutate(deletingSetlist.setlistId, {
      onSuccess: () => {
        toast.success('셋리스트를 삭제했습니다.');
        setDeletingSetlist(null);
        setConfirmText('');
      },
      onError: (err) => toast.error(err.message || '셋리스트 삭제에 실패했습니다.'),
    });
  }

  if (!isDesktop) {
    return (
      <p className="text-foreground-muted py-s-10 text-center text-sm">
        모바일에서는 지원하지 않는 기능입니다. PC에서 이용해 주세요.
      </p>
    );
  }

  return (
    <>
      <div className="border-border mb-s-3 pb-s-2 pt-s-1 border-b">
        <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">내 셋리스트</h2>
      </div>

      <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 mb-s-3 flex items-center rounded-[5px] border">
        <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="셋리스트 검색"
          aria-label="셋리스트 검색"
          className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
        />
      </div>

      {setlistsLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : hasQuery && isSearchError ? (
        <p className="text-danger py-s-6 text-center text-sm">셋리스트를 검색하지 못했습니다.</p>
      ) : setlists.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          {hasQuery ? '검색 결과가 없습니다.' : '생성된 셋리스트가 없습니다.'}
        </p>
      ) : (
        <>
          <ul className="gap-s-1 flex flex-col">
            {setlists.map((item) => {
              const href = ROUTES.SETLIST_DETAIL(item.setlistId);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <SetlistRow
                  key={item.setlistId}
                  item={item}
                  active={active}
                  isManager={item.managerId === me?.id}
                  onDeleteClick={() => {
                    setDeletingSetlist(item);
                    setConfirmText('');
                  }}
                />
              );
            })}
          </ul>
          {!hasQuery && hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {!hasQuery && isFetchingNextPage && (
            <div className="space-y-s-2 mt-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          )}
        </>
      )}

      <Dialog open={!!deletingSetlist} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>셋리스트 삭제</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-s-3">
            <p className="text-foreground-sub text-xs">
              셋리스트를 삭제하면 등록된 곡·시간표 시안도 함께 사라지며 복구할 수 없습니다.
            </p>
            <Input
              label={`셋리스트 이름(${deletingSetlist?.title ?? ''})을 그대로 입력해 주세요`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={deletingSetlist?.title}
            />
          </DialogBody>
          <DialogFooter className="border-t-0">
            <Button
              variant="ghost"
              className="h-8 rounded-[5px]"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              className="h-8 rounded-[5px] px-2"
              onClick={handleDelete}
              disabled={confirmText !== deletingSetlist?.title}
              loading={deleteMutation.isPending}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
