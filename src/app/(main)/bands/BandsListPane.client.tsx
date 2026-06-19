'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { MyItemMarker, myItemBorder } from '@/components/ui/my-item-marker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BandCreateModal } from '@/domain/band/components/BandCreateModal.client';
import { BandRoleBadge } from '@/domain/band/components/BandRoleBadge';
import { useBandList } from '@/domain/band/hooks/useBandList';
import { useBandSearch } from '@/domain/band/hooks/useBandSearch';
import { useMyBands } from '@/domain/band/hooks/useMyBands';
import type { BandInfoResponse, MyBandInfoResponse } from '@/domain/band/types';
import { ROUTES } from '@/global/config/routes';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

const BandIcon = DOMAIN_ICONS.band;

type Tab = 'mine' | 'discover';

function BandRow({
  band,
  pathname,
  myRole,
  showMineMarker = false,
}: {
  band: BandInfoResponse;
  pathname: string;
  myRole?: MyBandInfoResponse['myRole'];
  /** 탐색 탭에서 본인이 이미 가입한 밴드일 때 우상단 칩 + 좌측 보더 표시. */
  showMineMarker?: boolean;
}) {
  const href = ROUTES.BAND_DETAIL(band.bandId);
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        data-slot="band-row"
        className={listItemClasses(
          active,
          DOMAIN_LIST_SELECTED_TONES.band,
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ' +
            myItemBorder(showMineMarker),
        )}
      >
        <IconTile icon={<BandIcon />} size="sm" tone={DOMAIN_TONES.band} />
        <div className="min-w-0 flex-1">
          <div className="gap-s-2 flex items-center">
            <span className="text-caption truncate font-semibold">{band.bandName}</span>
            {myRole && <BandRoleBadge role={myRole} />}
          </div>
          {band.description && (
            <div className="text-foreground-muted text-caption mt-0.5 truncate">
              {band.description}
            </div>
          )}
        </div>
        {showMineMarker && <MyItemMarker label="내 밴드" />}
      </Link>
    </li>
  );
}

export function BandsListPane() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') === 'discover' ? 'discover' : 'mine') as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');

  // Mine (내 소속) — API_SPEC §3-3-1 /bands/me (myRole 포함)
  const { data: myBands, isLoading: myLoading } = useMyBands(20);

  // Discover: 기본 전체 목록 / 검색어 있으면 API 검색으로 전환
  const hasQuery = query.trim().length > 0;
  const { data: allBandsData, isLoading: allLoading } = useBandList(20);
  const allBands = allBandsData?.pages.flatMap((p) => p.content) ?? [];
  const { data: searchData, isLoading: searchLoading } = useBandSearch(query, 20);
  const searchResults = searchData?.pages.flatMap((p) => p.content) ?? [];

  const discoverBands = hasQuery ? searchResults : allBands;
  const discoverLoading = hasQuery ? searchLoading : allLoading;

  const onTabChange = (next: string) => {
    const t = next === 'discover' ? 'discover' : 'mine';
    setTab(t);
    setQuery('');
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', t);
    router.replace(`${pathname.startsWith('/bands') ? pathname : '/bands'}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--band-list-pane-w)' }}
      data-slot="bands-list-pane"
      aria-label="밴드 탐색"
    >
      <div className="border-border px-s-3 py-s-3 flex items-center justify-between border-b">
        <h2 className="text-body font-bold">밴드 탐색</h2>
        <BandCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="밴드 생성">
              <Plus className="h-4 w-4" /> 밴드 생성
            </Button>
          }
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={onTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-border px-s-4 py-s-3 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1">
              내 밴드
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex-1">
              탐색
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mine" className="px-s-2 py-s-2 flex-1 overflow-y-auto">
          {myLoading ? (
            <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
          ) : !myBands || myBands.length === 0 ? (
            <p className="text-foreground-muted p-s-3 text-caption">참여 중인 밴드가 없습니다.</p>
          ) : (
            <ul className="gap-s-1 flex flex-col">
              {myBands.map((b) => (
                <BandRow key={b.bandId} band={b} pathname={pathname} myRole={b.myRole} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="discover" className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border px-s-4 py-s-3 border-b">
            <div className="bg-card border-border gap-s-2 px-s-3 py-s-2 flex items-center rounded-md border">
              <Search className="text-foreground-muted h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="밴드 이름·소개 검색…"
                aria-label="밴드 검색"
                className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
            {discoverLoading ? (
              <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
            ) : discoverBands.length === 0 ? (
              <p className="text-foreground-muted p-s-3 text-caption">
                {hasQuery ? '검색 결과가 없습니다.' : '등록된 밴드가 없습니다.'}
              </p>
            ) : (
              <ul className="gap-s-1 flex flex-col">
                {discoverBands.map((b) => {
                  const myEntry = myBands?.find((mb) => mb.bandId === b.bandId);
                  return (
                    <BandRow
                      key={b.bandId}
                      band={b}
                      pathname={pathname}
                      myRole={myEntry?.myRole}
                      showMineMarker={!!myEntry}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
