'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { PerformanceCreateModal } from '@/domain/performance/components/PerformanceCreateModal.client';
import { usePerformanceList } from '@/domain/performance/hooks/usePerformanceList';
import type { PerformanceListItemResponse } from '@/domain/performance/types';
import { ROUTES } from '@/global/config/routes';
import { useDiscoverySearch } from '@/hooks/useDiscoverySearch';
import { cn } from '@/lib/cn';

const accessor = (p: PerformanceListItemResponse) => `${p.title} ${p.venue ?? ''}`;

/** 데스크톱(lg 이상) 좌측 공연 목록 패널. 검색 input 포함. */
export function PerformancesListPane() {
  const pathname = usePathname() ?? '';
  const { data, isLoading } = usePerformanceList();

  const performances = data?.pages.flatMap((p) => p.content) ?? [];
  const accessorRef = useCallback(accessor, []);
  const { query, setQuery, filtered, isFiltering } = useDiscoverySearch(performances, accessorRef);

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="performances-list-pane"
      aria-label="공연 목록"
    >
      <div className="border-border px-s-5 py-s-4 flex items-center justify-between border-b">
        <h2 className="text-subtitle font-bold">공연 탐색</h2>
        <PerformanceCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="새 공연 만들기">
              <Plus className="h-4 w-4" /> 새 공연
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
            placeholder="공연 제목·장소 검색…"
            aria-label="공연 검색"
            className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
          />
        </div>
      </div>
      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">
            {isFiltering ? '검색 결과가 없습니다.' : '예정된 공연이 없습니다.'}
          </p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {filtered.map((p) => {
              const href = ROUTES.PERFORMANCE_DETAIL(p.performanceId);
              const active = pathname === href;
              return (
                <li key={p.performanceId}>
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
                    <div className="text-foreground-muted text-caption mt-0.5 truncate">
                      {p.startAt}
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
