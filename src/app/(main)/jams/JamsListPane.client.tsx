'use client';

import { formatInTimeZone } from 'date-fns-tz';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyJams } from '@/domain/jam/hooks/useMyJams';
import { useSearchMyJams } from '@/domain/jam/hooks/useSearchMyJams';
import type { JamListItemResponse } from '@/domain/jam/types';
import { ROUTES } from '@/global/config/routes';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

const PracticeIcon = DOMAIN_ICONS.practice;

function PracticeRow({ p, pathname }: { p: JamListItemResponse; pathname: string }) {
  const href = ROUTES.JAM_DETAIL(p.jamId);
  const active = pathname === href;
  const when = formatInTimeZone(new Date(p.startAt), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        data-slot="practice-row"
        className={listItemClasses(
          active,
          DOMAIN_LIST_SELECTED_TONES.practice,
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <IconTile icon={<PracticeIcon />} size="sm" tone={DOMAIN_TONES.practice} />
        <div className="min-w-0 flex-1">
          <div className="text-caption truncate font-semibold">{p.title}</div>
          <div className="text-foreground-muted text-caption gap-s-2 mt-0.5 flex items-center">
            <span>{when}</span>
            {p.venue && <span className="truncate">· {p.venue}</span>}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function JamsListPane() {
  const pathname = usePathname() ?? '';
  const [query, setQuery] = useState('');

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

  const isSearching = query.trim().length > 0;
  const jams = isSearching ? searchJams : myJams;
  const isLoading = isSearching ? searchLoading : myLoading;
  const hasNextPage = isSearching ? hasNextSearchJams : hasNextMyJams;
  const isFetchingNextPage = isSearching ? isFetchingNextSearchJams : isFetchingNextMyJams;
  const fetchNextPage = isSearching ? fetchNextSearchJams : fetchNextMyJams;
  const loadMoreRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="practices-list-pane"
      aria-label="내 합주"
    >
      <div className="border-border px-s-3 py-s-3 flex items-center justify-between border-b">
        <h2 className="text-body font-bold">내 합주</h2>
        <Button asChild size="sm" variant="accent-outline" aria-label="합주 생성">
          <Link href={ROUTES.JAM_CREATE}>
            <Plus className="h-4 w-4" /> 합주 생성
          </Link>
        </Button>
      </div>
      <div className="border-border px-s-4 py-s-3 border-b">
        <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
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
      </div>
      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
        ) : jams.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">
            {isSearching ? '검색 결과가 없습니다.' : '예정된 합주가 없습니다.'}
          </p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {jams.map((p) => (
              <PracticeRow key={p.jamId} p={p} pathname={pathname} />
            ))}
            {hasNextPage && (
              <li aria-hidden="true">
                <div ref={loadMoreRef} className="h-4" />
              </li>
            )}
            {isFetchingNextPage && (
              <li className="p-s-2">
                <Skeleton className="h-10 w-full" rounded="md" />
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
