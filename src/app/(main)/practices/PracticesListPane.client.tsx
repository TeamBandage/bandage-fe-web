'use client';

import { formatInTimeZone } from 'date-fns-tz';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { PracticeCreateModal } from '@/domain/practice/components/PracticeCreateModal.client';
import { usePractices } from '@/domain/practice/hooks/usePractices';
import type { PracticeListItemResponse } from '@/domain/practice/types';
import { ROUTES } from '@/global/config/routes';
import { useDiscoverySearch } from '@/hooks/useDiscoverySearch';
import { cn } from '@/lib/cn';

const accessor = (p: PracticeListItemResponse) =>
  `${p.title} ${p.venue ?? ''} ${p.song?.title ?? ''}`;

/** 데스크톱(lg 이상) 좌측 합주 목록 패널. 검색 input 포함. */
export function PracticesListPane() {
  const pathname = usePathname() ?? '';
  const { data, isLoading } = usePractices(undefined, 20);

  const practices = data?.pages.flatMap((p) => p.content) ?? [];
  const accessorRef = useCallback(accessor, []);
  const { query, setQuery, filtered, isFiltering } = useDiscoverySearch(practices, accessorRef);

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="practices-list-pane"
      aria-label="합주 목록"
    >
      <div className="border-border px-s-5 py-s-4 flex items-center justify-between border-b">
        <h2 className="text-subtitle font-bold">합주 탐색</h2>
        <PracticeCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="새 합주 만들기">
              <Plus className="h-4 w-4" /> 새 합주
            </Button>
          }
        />
      </div>
      <div className="border-border px-s-4 py-s-3 border-b">
        <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
          <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·장소·곡 검색…"
            aria-label="합주 검색"
            className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
          />
        </div>
      </div>
      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">
            {isFiltering ? '검색 결과가 없습니다.' : '예정된 합주가 없습니다.'}
          </p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {filtered.map((p) => {
              const href = ROUTES.PRACTICE_DETAIL(p.practiceId);
              const active = pathname === href;
              const when = formatInTimeZone(new Date(p.startAt), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
              return (
                <li key={p.practiceId}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'px-s-3 py-s-3 block rounded-md transition-colors',
                      active
                        ? 'bg-accent-dim text-accent'
                        : 'hover:bg-card text-foreground-sub hover:text-foreground',
                    )}
                  >
                    <div className="text-body truncate font-semibold">{p.title}</div>
                    <div className="text-foreground-muted text-caption gap-s-2 mt-0.5 flex items-center">
                      <span>{when}</span>
                      {p.venue && <span className="truncate">· {p.venue}</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
