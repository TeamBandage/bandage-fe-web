'use client';

import { ListMusic, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/domain/member/hooks/useMe';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import { useSetlistsByTitle } from '@/domain/setlist/hooks/useSetlistsByTitle';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';
import { listItemClasses } from '@/lib/list-item-styles';

function SetlistRow({
  item,
  active,
  isManager,
}: {
  item: SetlistResponse;
  active: boolean;
  isManager: boolean;
}) {
  const href = ROUTES.SETLIST_DETAIL(item.setlistId);

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        data-slot="setlist-row"
        className={listItemClasses(
          active,
          'accent',
          cn(
            'text-foreground focus-visible:ring-offset-bg items-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none',
            active && 'border-white/25 bg-white/10 hover:bg-white/10',
          ),
        )}
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
    </li>
  );
}

export function SetlistsMobileShell() {
  const pathname = usePathname() ?? '';
  const isDesktop = useIsDesktop();
  const { data: me } = useMe();
  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;

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
    </>
  );
}
