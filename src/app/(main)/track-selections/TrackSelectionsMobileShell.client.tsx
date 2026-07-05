'use client';

import { Lock, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyTrackSelections } from '@/domain/track-selection/hooks/useMyTrackSelections';
import type { TrackSelectionResponse } from '@/domain/track-selection/types/res';
import { ROUTES } from '@/global/config/routes';
import { useIsDesktop } from '@/hooks/use-media-query';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

const TrackSelectionIcon = DOMAIN_ICONS['track-selection'];

function MeetingRow({ item, active }: { item: TrackSelectionResponse; active: boolean }) {
  const locked = Boolean(item.lockedAt);
  const updatedLabel = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <li>
      <Link
        href={ROUTES.TRACK_SELECTION_DETAIL(item.selectionId)}
        aria-current={active ? 'page' : undefined}
        data-slot="track-selection-row"
        className={listItemClasses(
          active,
          DOMAIN_LIST_SELECTED_TONES['track-selection'],
          'focus-visible:ring-offset-bg text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <IconTile icon={<TrackSelectionIcon />} size="sm" className="bg-white/15 text-white" />
        <div className="min-w-0 flex-1">
          <div className="gap-s-1 flex items-center">
            <span className="text-caption truncate font-semibold">{item.title}</span>
            {locked && <Lock className="text-foreground-muted h-3 w-3 shrink-0" />}
          </div>
          {updatedLabel && (
            <div className="text-foreground-muted text-caption mt-0.5">{updatedLabel}</div>
          )}
        </div>
      </Link>
    </li>
  );
}

export function TrackSelectionsMobileShell() {
  const pathname = usePathname() ?? '';
  const isDesktop = useIsDesktop();

  const { data, isLoading } = useMyTrackSelections(50);
  const meetings = data?.pages.flatMap((p) => p.content) ?? [];

  if (!isDesktop) {
    return (
      <p className="text-foreground-muted py-s-10 text-center text-sm">
        모바일에서는 지원하지 않는 기능입니다. PC에서 이용해 주세요.
      </p>
    );
  }

  return (
    <>
      <div className="border-border mb-s-3 pb-s-2 pt-s-1 flex items-center justify-between border-b">
        <h2 className="text-foreground pl-2.5 text-2xl font-bold lg:text-3xl">내 선곡</h2>
        <Button
          asChild
          size="sm"
          variant="accent-outline"
          aria-label="선곡 생성"
          className="rounded-[5px] border-white text-white hover:border-transparent hover:bg-white hover:text-neutral-900 active:border-transparent active:bg-neutral-200 active:text-neutral-900"
        >
          <Link href={ROUTES.TRACK_SELECTION_CREATE}>
            <Plus className="h-4 w-4" /> 선곡 생성
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-s-2">
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
          <Skeleton className="h-14 w-full" rounded="md" />
        </div>
      ) : meetings.length === 0 ? (
        <p className="text-foreground-muted py-s-6 text-center text-sm">
          참여 중인 선곡회의가 없습니다.
        </p>
      ) : (
        <ul className="gap-s-1 flex flex-col">
          {meetings.map((item) => {
            const href = ROUTES.TRACK_SELECTION_DETAIL(item.selectionId);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <MeetingRow key={item.selectionId} item={item} active={active} />;
          })}
        </ul>
      )}
    </>
  );
}
