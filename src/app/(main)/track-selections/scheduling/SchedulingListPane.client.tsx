'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { cn } from '@/lib/cn';

import {
  selectSchedulingProgress,
  useScheduleStore,
} from '@/domain/schedule-coordination/store/scheduleStore';
import { useTimetableStore } from '@/domain/schedule-coordination/store/timetableStore';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Meeting } from '@/domain/setlist-meeting/types';
import { ROUTES } from '@/global/config/routes';
import { DOMAIN_IMAGES, DOMAIN_LIST_SELECTED_TONES } from '@/lib/domain-icons';
import { listItemClasses } from '@/lib/list-item-styles';

interface SchedulingSummary {
  meeting: Meeting;
  total: number;
  completed: number;
  pct: number;
  confirmed: boolean;
}

function SchedulingRow({ summary, active }: { summary: SchedulingSummary; active: boolean }) {
  const { meeting, total, completed, pct, confirmed } = summary;
  const barTone = confirmed ? 'bg-success' : 'bg-accent';
  const labelTone = confirmed ? 'text-success' : 'text-accent';
  return (
    <li>
      <Link
        href={ROUTES.TRACK_SELECTION_SCHEDULING_DETAIL(meeting.id)}
        aria-current={active ? 'page' : undefined}
        data-slot="scheduling-meeting-row"
        className={listItemClasses(
          active,
          DOMAIN_LIST_SELECTED_TONES['track-selection'],
          'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DOMAIN_IMAGES['track-selection']}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 shrink-0 rounded-sm object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className={cn('text-micro truncate font-semibold', labelTone)}>
            {meeting.bandName}
          </div>
          <div className="text-caption mt-0.5 truncate font-bold">{meeting.title}</div>
          <div className="mt-s-2 gap-s-2 flex items-center">
            <div
              className="bg-card border-border h-1.5 flex-1 overflow-hidden rounded-full border"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${meeting.title} 일정 입력 ${pct}%`}
            >
              <div className={cn('h-full', barTone)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-foreground-muted text-micro shrink-0 tabular-nums">
              {completed}/{total}
            </span>
          </div>
          <div className="text-foreground-muted text-micro mt-0.5">
            {confirmed ? '시간표 확정' : `입력 ${pct}%`}
          </div>
        </div>
      </Link>
    </li>
  );
}

export interface SchedulingListPaneProps {
  mode?: 'overlay' | 'fixed';
  open?: boolean;
  onClose?: () => void;
}

export function SchedulingListPane({
  mode = 'fixed',
  open = false,
  onClose,
}: SchedulingListPaneProps = {}) {
  const pathname = usePathname() ?? '';
  const meetings = useSetlistStore((s) => s.meetings);
  const schedules = useScheduleStore((s) => s.schedules);
  const confirmedMap = useTimetableStore((s) => s.confirmedByMeetingId);

  const summaries = useMemo<SchedulingSummary[]>(() => {
    return meetings.map((meeting) => {
      const participantUserIds = meeting.participantUserIds ?? [];
      const { total, completed, pct } = selectSchedulingProgress(
        schedules,
        meeting.id,
        participantUserIds,
      );
      return {
        meeting,
        total,
        completed,
        pct,
        confirmed: Boolean(confirmedMap[meeting.id]),
      };
    });
  }, [meetings, schedules, confirmedMap]);

  const overlay = mode === 'overlay';

  return (
    <aside
      className={cn(
        'bg-surface border-border shrink-0 flex-col border-r shadow-lg',
        overlay
          ? cn(
              'absolute top-0 left-0 z-30 h-full transition-transform duration-200 ease-out',
              open ? 'flex translate-x-0' : 'pointer-events-none flex -translate-x-full',
            )
          : 'hidden lg:flex',
      )}
      style={{ width: 'var(--list-pane-w)' }}
      data-slot="scheduling-list-pane"
      aria-label="합주 일정 조율 회의 목록"
      aria-hidden={overlay && !open ? true : undefined}
    >
      <div className="border-border px-s-3 py-s-3 gap-s-2 flex items-center justify-between border-b">
        <div className="min-w-0">
          <h2 className="text-body font-bold">합주 일정 조율</h2>
          <p className="text-foreground-muted text-micro mt-0.5">{meetings.length}건 조율 중</p>
        </div>
        {overlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground rounded-md p-1"
            aria-label="목록 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="px-s-2 py-s-2 flex-1 overflow-y-auto">
        {summaries.length === 0 ? (
          <p className="text-foreground-muted p-s-3 text-caption">조율 중인 회의가 없습니다.</p>
        ) : (
          <ul className="gap-s-1 flex flex-col">
            {summaries.map((s) => {
              const href = ROUTES.TRACK_SELECTION_SCHEDULING_DETAIL(s.meeting.id);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <SchedulingRow key={s.meeting.id} summary={s} active={active} />;
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
