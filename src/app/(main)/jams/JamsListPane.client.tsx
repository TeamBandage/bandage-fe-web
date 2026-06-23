'use client';

import { formatInTimeZone } from 'date-fns-tz';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useJams } from '@/domain/jam/hooks/useJams';
import { useMyJams } from '@/domain/jam/hooks/useMyJams';
import type { JamListItemResponse } from '@/domain/jam/types';
import { ROUTES } from '@/global/config/routes';
import { useDiscoverySearch } from '@/hooks/useDiscoverySearch';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

const PracticeIcon = DOMAIN_ICONS.practice;

const accessor = (p: JamListItemResponse) => `${p.title} ${p.venue ?? ''} ${p.title}`;

type Tab = 'mine' | 'discover';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') === 'discover' ? 'discover' : 'mine') as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);

  const { data: myData, isLoading: myLoading } = useMyJams(20);
  const myJams = myData?.pages.flatMap((p) => p.content) ?? [];

  const { data: allData, isLoading: allLoading } = useJams(undefined, 20);
  const allJams = allData?.pages.flatMap((p) => p.content) ?? [];
  const accessorRef = useCallback(accessor, []);
  const { query, setQuery, filtered, isFiltering } = useDiscoverySearch(allJams, accessorRef);

  const onTabChange = (next: string) => {
    const t = next === 'discover' ? 'discover' : 'mine';
    setTab(t);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', t);
    router.replace(`${ROUTES.JAMS}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="practices-list-pane"
      aria-label="합주 탐색"
    >
      <div className="border-border px-s-3 py-s-3 flex items-center justify-between border-b">
        <h2 className="text-body font-bold">합주 탐색</h2>
        <Button asChild size="sm" variant="accent-outline" aria-label="합주 생성">
          <Link href={ROUTES.JAM_NEW}>
            <Plus className="h-4 w-4" /> 합주 생성
          </Link>
        </Button>
      </div>
      <Tabs
        value={tab}
        onValueChange={onTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-border px-s-4 py-s-3 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1">
              내 합주
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex-1">
              탐색
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mine" className="px-s-2 py-s-2 flex-1 overflow-y-auto">
          {myLoading ? (
            <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
          ) : myJams.length === 0 ? (
            <p className="text-foreground-muted p-s-3 text-caption">예정된 합주가 없습니다.</p>
          ) : (
            <ul className="gap-s-1 flex flex-col">
              {myJams.map((p) => (
                <PracticeRow key={p.jamId} p={p} pathname={pathname} />
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
                placeholder="제목·장소·곡 검색…"
                aria-label="합주 검색"
                className="text-body placeholder:text-foreground-muted w-full bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
            {allLoading ? (
              <p className="text-foreground-muted p-s-3 text-caption">불러오는 중…</p>
            ) : filtered.length === 0 ? (
              <p className="text-foreground-muted p-s-3 text-caption">
                {isFiltering ? '검색 결과가 없습니다.' : '등록된 합주가 없습니다.'}
              </p>
            ) : (
              <ul className="gap-s-1 flex flex-col">
                {filtered.map((p) => (
                  <PracticeRow key={p.jamId} p={p} pathname={pathname} />
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
