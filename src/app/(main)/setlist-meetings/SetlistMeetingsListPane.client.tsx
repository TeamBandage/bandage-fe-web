'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { IconTile } from '@/components/ui/icon-tile';
import { MeetingCreateModal } from '@/domain/setlist-meeting/components/MeetingCreateModal.client';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Meeting, Song } from '@/domain/setlist-meeting/types';
import { isReady } from '@/domain/setlist-meeting/utils';
import { ROUTES } from '@/global/config/routes';
import { DOMAIN_ICONS, DOMAIN_LIST_SELECTED_TONES, DOMAIN_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

const SetlistIcon = DOMAIN_ICONS['setlist-meeting'];

type MeetingSummary = {
  meeting: Meeting;
  total: number;
  ready: number;
};

function progress({ total, ready }: { total: number; ready: number }): number {
  if (total === 0) return 0;
  return Math.round((ready / total) * 100);
}

function MeetingRow({ summary, active }: { summary: MeetingSummary; active: boolean }) {
  const { meeting, total, ready } = summary;
  const pct = progress({ total, ready });
  return (
    <li>
      <Link
        href={ROUTES.SETLIST_MEETING_DETAIL(meeting.id)}
        aria-current={active ? 'page' : undefined}
        data-slot="setlist-meeting-row"
        className={listItemClasses(
          active,
          DOMAIN_LIST_SELECTED_TONES['setlist-meeting'],
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <IconTile icon={<SetlistIcon />} size="sm" tone={DOMAIN_TONES['setlist-meeting']} />
        <div className="min-w-0 flex-1">
          <div className="text-accent text-micro truncate font-semibold">{meeting.bandName}</div>
          <div className="text-caption mt-0.5 truncate font-bold">{meeting.title}</div>
          <div className="mt-s-2 gap-s-2 flex items-center">
            <div
              className="bg-card border-border h-1.5 flex-1 overflow-hidden rounded-full border"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${meeting.title} 확정률 ${pct}%`}
            >
              <div className="bg-accent h-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-foreground-muted text-micro shrink-0 tabular-nums">
              {ready}/{total}
            </span>
          </div>
          <div className="text-foreground-muted text-micro mt-0.5">{meeting.updatedAt}</div>
        </div>
      </Link>
    </li>
  );
}

export function SetlistMeetingsListPane() {
  const pathname = usePathname() ?? '';
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);

  const summaries = useMemo<MeetingSummary[]>(() => {
    return meetings.map((meeting) => {
      const ms = songs.filter((song: Song) => song.meetingId === meeting.id);
      const total = ms.length;
      const ready = ms.filter(isReady).length;
      return { meeting, total, ready };
    });
  }, [meetings, songs]);

  return (
    <aside
      className="bg-surface border-border hidden shrink-0 flex-col border-r lg:flex"
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="setlist-meetings-list-pane"
      aria-label="선곡 회의 목록"
    >
      <div className="border-border px-s-3 py-s-3 flex items-center justify-between border-b">
        <div className="min-w-0">
          <h2 className="text-body font-bold">선곡 회의</h2>
          <p className="text-foreground-muted text-micro mt-0.5">{meetings.length}건 참여</p>
        </div>
        <MeetingCreateModal
          trigger={
            <Button size="sm" variant="accent-outline" aria-label="새 선곡 회의 만들기">
              <Plus className="h-4 w-4" /> 회의 만들기
            </Button>
          }
        />
      </div>
      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {summaries.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">
            참여 중인 선곡 회의가 없습니다.
          </p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {summaries.map((s) => {
              const href = ROUTES.SETLIST_MEETING_DETAIL(s.meeting.id);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <MeetingRow key={s.meeting.id} summary={s} active={active} />;
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
