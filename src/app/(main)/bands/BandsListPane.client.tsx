'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { BandCreateModal } from '@/domain/band/components/BandCreateModal.client';
import { useBandList } from '@/domain/band/hooks/useBandList';
import type { BandInfoResponse } from '@/domain/band/types';
import { ROUTES } from '@/global/config/routes';
import { useDiscoverySearch } from '@/hooks/useDiscoverySearch';
import { cn } from '@/lib/cn';

const accessor = (b: BandInfoResponse) => `${b.bandName} ${b.description ?? ''}`;

/**
 * 데스크톱(lg 이상) 좌측 밴드 목록 패널.
 * PaneList width="band-list" 의 아이템 배치 전용 — 카드를 간략 리스트로 렌더.
 * 검색 input 으로 클라이언트 사이드 필터링 (Discovery — Task 18).
 */
export function BandsListPane() {
  const pathname = usePathname() ?? '';
  const { data, isLoading } = useBandList();

  const bands = data?.pages.flatMap((p) => p.content) ?? [];
  const accessorRef = useCallback(accessor, []);
  const { query, setQuery, filtered, isFiltering } = useDiscoverySearch(bands, accessorRef);

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--band-list-pane-w)' }}
      data-slot="bands-list-pane"
      aria-label="밴드 탐색"
    >
      <div className="border-border px-s-5 py-s-4 flex items-center justify-between border-b">
        <h2 className="text-subtitle font-bold">밴드 탐색</h2>
        <BandCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="새 밴드 만들기">
              <Plus className="h-4 w-4" /> 밴드 만들기
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
            placeholder="밴드 이름으로 검색…"
            aria-label="밴드 검색"
            className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">
            {isFiltering ? '검색 결과가 없습니다.' : '참여 중인 밴드가 없습니다.'}
          </p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {filtered.map((b) => {
              const href = ROUTES.BAND_DETAIL(b.bandId);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={b.bandId}>
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
                    <div className="text-body truncate font-semibold">{b.bandName}</div>
                    {b.description && (
                      <div className="text-foreground-muted text-caption mt-0.5 truncate">
                        {b.description}
                      </div>
                    )}
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
