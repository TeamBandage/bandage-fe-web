'use client';

import { ListMusic } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import { useMySetlists } from '@/domain/setlist/hooks/useMySetlists';
import type { SetlistResponse } from '@/domain/setlist/types/res';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';
import { listItemClasses } from '@/lib/list-item-styles';

function SetlistRow({ item, active }: { item: SetlistResponse; active: boolean }) {
  const href = ROUTES.SETLIST_DETAIL(item.setlistId);
  const dateLabel = item.updatedAt ?? item.createdAt;
  const label = dateLabel
    ? new Date(dateLabel).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

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
            'text-foreground focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none',
            active && 'border-white/25 bg-white/10 hover:bg-white/10',
          ),
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
          <ListMusic className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-caption truncate font-semibold">{item.title}</div>
          {label && <div className="text-foreground-muted text-caption mt-0.5">{label}</div>}
        </div>
      </Link>
    </li>
  );
}

export function SetlistsMobileShell() {
  const pathname = usePathname() ?? '';
  const isDesktop = useIsDesktop();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMySetlists();
  const setlists = data?.pages.flatMap((p) => p.content) ?? [];
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

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

      {isLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : setlists.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          생성된 셋리스트가 없습니다.
        </p>
      ) : (
        <>
          <ul className="gap-s-1 flex flex-col">
            {setlists.map((item) => {
              const href = ROUTES.SETLIST_DETAIL(item.setlistId);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <SetlistRow key={item.setlistId} item={item} active={active} />;
            })}
          </ul>
          {hasNextPage && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          {isFetchingNextPage && (
            <div className="space-y-s-2 mt-s-2">
              <Skeleton className="h-14 w-full" rounded="md" />
            </div>
          )}
        </>
      )}
    </>
  );
}
