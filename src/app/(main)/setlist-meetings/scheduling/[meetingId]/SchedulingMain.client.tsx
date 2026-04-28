'use client';

import { CalendarDays, CheckCircle2, Clock3, Crown, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { ScheduleBoardEditor } from '@/domain/schedule-coordination/components/ScheduleBoardEditor.client';
import { ScheduleBoardList } from '@/domain/schedule-coordination/components/ScheduleBoardList.client';
import { ViewUnitToggle } from '@/domain/schedule-coordination/components/ViewUnitToggle.client';
import { useBoardStore } from '@/domain/schedule-coordination/store/boardStore';
import { useScheduleViewUnit } from '@/domain/schedule-coordination/hooks/useScheduleViewUnit';
import { useScheduleStore } from '@/domain/schedule-coordination/store/scheduleStore';
import { useTimetableStore } from '@/domain/schedule-coordination/store/timetableStore';
import {
  aggregateAvailability,
  enumerateDays,
  slotToTime,
  type ViewUnit,
} from '@/domain/schedule-coordination/utils';
import { MemberAvatar } from '@/domain/setlist-meeting/components/MemberAvatar';
import { GLOBAL_MEMBER_POOL } from '@/domain/setlist-meeting/mock/memberSearchMock';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Member, Song } from '@/domain/setlist-meeting/types';
import { isReady } from '@/domain/setlist-meeting/utils';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { ScheduleInputModal } from './ScheduleInputModal.client';

type LeftTab = 'member' | 'song' | 'board';
type SongFilter = 'mine' | 'all';
type RightPanel =
  | { kind: 'member'; member: Member }
  | { kind: 'song'; song: Song }
  | { kind: 'board'; boardId: string }
  | null;

export function SchedulingMain({ meetingId }: { meetingId: string }) {
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const meeting = useMemo(() => meetings.find((m) => m.id === meetingId), [meetings, meetingId]);
  const allSongs = useMemo(
    () => songs.filter((s) => s.meetingId === meetingId),
    [songs, meetingId],
  );

  const isManager = meeting ? meeting.managerId === currentUserId : false;
  const participantIds = useMemo(() => meeting?.participantUserIds ?? [], [meeting]);
  const participants = useMemo<Member[]>(
    () =>
      participantIds
        .map((id) => GLOBAL_MEMBER_POOL.find((m) => m.id === id))
        .filter((m): m is Member => Boolean(m)),
    [participantIds],
  );

  const schedulesAll = useScheduleStore((s) => s.schedules);
  const memberSchedules = useMemo(
    () =>
      participantIds
        .map((uid) => schedulesAll[`${meetingId}__${uid}`])
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [participantIds, schedulesAll, meetingId],
  );

  const [leftTab, setLeftTab] = useState<LeftTab>('member');
  const [songFilter, setSongFilter] = useState<SongFilter>('mine');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const lockMeeting = useSetlistStore((s) => s.lockMeeting);
  const isConfirmedTimetable = useTimetableStore((s) => Boolean(s.confirmedByMeetingId[meetingId]));

  const visibleSongs = useMemo<Song[]>(() => {
    const ready = allSongs.filter((s) => isReady(s));
    const pool = ready.length > 0 ? ready : allSongs;
    if (songFilter === 'all') return pool;
    return pool.filter(
      (s) =>
        Object.values(s.applicants).some((list) => list.includes(currentUserId)) ||
        Object.values(s.confirmed).some((list) => list.includes(currentUserId)),
    );
  }, [allSongs, songFilter, currentUserId]);

  /** 시간표 에디터 블록 풀 — 확정 곡만. */
  const editorSongPool = useMemo(
    () =>
      allSongs
        .filter((s) => isReady(s))
        .map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
    [allSongs],
  );

  const window = meeting?.practiceWindow;
  const allDays = useMemo(() => (window ? enumerateDays(window.from, window.to) : []), [window]);
  const view = useScheduleViewUnit({
    from: window?.from ?? '',
    to: window?.to ?? '',
  });
  const visibleDays = useMemo(() => {
    if (!window || allDays.length === 0) return allDays;
    if (view.unit === 'day') {
      return allDays.slice(0, 14);
    }
    if (view.unit === 'week') {
      const idx = allDays.indexOf(view.anchor);
      const start = idx === -1 ? 0 : idx;
      return allDays.slice(start, start + 7);
    }
    const ym = view.anchor.slice(0, 7);
    return allDays.filter((d) => d.startsWith(ym));
  }, [allDays, view.unit, view.anchor, window]);

  const bestSlot = useMemo(() => {
    if (!window || memberSchedules.length === 0) return null;
    const aggregate = aggregateAvailability(memberSchedules, allDays);
    let best: { date: string; slot: number; count: number } | null = null;
    for (const date of allDays) {
      const counts = aggregate[date] ?? [];
      for (let i = 0; i < counts.length; i++) {
        const c = counts[i] ?? 0;
        if (c > 0 && (!best || c > best.count)) best = { date, slot: i, count: c };
      }
    }
    return best;
  }, [allDays, memberSchedules, window]);

  if (!meeting) {
    return (
      <div className="px-s-5 py-s-6">
        <p className="text-foreground-muted text-caption">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const completedCount = participantIds.filter(
    (uid) => schedulesAll[`${meetingId}__${uid}`]?.completed,
  ).length;

  const tabItems = [
    { id: 'member' as const, label: '멤버 시간표', badge: participants.length },
    { id: 'song' as const, label: '합주곡 시간표', badge: visibleSongs.length },
    ...(isManager ? [{ id: 'board' as const, label: '합주 시간표 생성' }] : []),
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <header className="border-border px-s-5 py-s-4 border-b">
        <div className="text-accent text-caption font-semibold">{meeting.bandName}</div>
        <h1 className="text-title-lg mt-s-1 font-bold">{meeting.title}</h1>
        <div className="text-foreground-muted text-caption gap-s-3 mt-s-2 flex flex-wrap items-center">
          {window && (
            <span className="gap-s-1 inline-flex items-center">
              <CalendarDays className="h-3.5 w-3.5" />
              {window.from} ~ {window.to}
            </span>
          )}
          <span className="gap-s-1 inline-flex items-center">
            <Crown className="text-amber h-3.5 w-3.5" />
            매니저 {GLOBAL_MEMBER_POOL.find((m) => m.id === meeting.managerId)?.name ?? '?'}
          </span>
          <span
            className={cn(
              'text-micro px-s-2 rounded-full py-0.5 font-bold',
              isConfirmedTimetable ? 'bg-success-dim text-success' : 'bg-accent-dim text-accent',
            )}
          >
            {isConfirmedTimetable
              ? `시간표 확정 — ${completedCount}/${participants.length} 참여`
              : `${completedCount}/${participants.length} 명 일정 입력 완료`}
          </span>
        </div>
        <div
          className="bg-card border-border mt-s-3 h-2 w-full max-w-md overflow-hidden rounded-full border"
          role="progressbar"
          aria-valuenow={
            participants.length === 0 ? 0 : Math.round((completedCount / participants.length) * 100)
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="일정 입력 진행도"
        >
          <div
            className={cn(
              'h-full transition-all',
              isConfirmedTimetable ? 'bg-success' : 'bg-accent',
            )}
            style={{
              width: `${
                participants.length === 0
                  ? 0
                  : Math.round((completedCount / participants.length) * 100)
              }%`,
            }}
          />
        </div>
        <div className="mt-s-3 gap-s-2 flex flex-wrap items-center">
          <Button size="sm" variant="primary" onClick={() => setScheduleOpen(true)}>
            <Clock3 className="h-4 w-4" /> 나의 스케줄 입력
          </Button>
          {isManager && memberSchedules.length > 0 && bestSlot && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setConfirmOpen(true)}
              className="bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> 합주 일정 확정
            </Button>
          )}
        </div>
      </header>

      {/* Main split — 좌측 40% / 우측 60%. md 이하는 세로 스택. */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <section className="border-border flex flex-col md:w-2/5 md:border-r">
          <div className="px-s-4 pt-s-3 border-border border-b">
            <UnderlineTabs value={leftTab} onChange={setLeftTab} items={tabItems} width="equal" />
          </div>
          <div className="flex-1 overflow-y-auto" id={`tabpanel-${leftTab}`} role="tabpanel">
            {leftTab === 'member' && (
              <MemberListPane
                participants={participants}
                meetingId={meetingId}
                currentUserId={currentUserId}
                schedulesAll={schedulesAll}
                onPick={(m) => setRightPanel({ kind: 'member', member: m })}
              />
            )}
            {leftTab === 'song' && (
              <SongListPane
                songs={visibleSongs}
                filter={songFilter}
                onFilterChange={setSongFilter}
                onPick={(song) => setRightPanel({ kind: 'song', song })}
              />
            )}
            {leftTab === 'board' && isManager && (
              <ScheduleBoardList
                meetingId={meetingId}
                selectedBoardId={rightPanel?.kind === 'board' ? rightPanel.boardId : null}
                onSelect={(boardId) => setRightPanel({ kind: 'board', boardId })}
              />
            )}
          </div>
        </section>

        <section className="bg-bg flex flex-1 flex-col overflow-hidden md:w-3/5">
          <RightVisualization
            panel={rightPanel}
            onClose={() => setRightPanel(null)}
            meetingId={meetingId}
            visibleDays={visibleDays}
            participants={participants}
            memberSchedules={memberSchedules}
            view={view}
            songPool={editorSongPool}
          />
        </section>
      </div>

      {scheduleOpen && (
        <ScheduleInputModal
          meetingId={meetingId}
          userId={currentUserId}
          allDays={allDays}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="합주 일정 확정"
        description={
          bestSlot
            ? `가장 많은 멤버가 가능한 ${bestSlot.date} ${slotToTime(bestSlot.slot)} (${bestSlot.count}명) 슬롯으로 확정하시겠습니까?`
            : '확정 가능한 슬롯이 없습니다.'
        }
        confirmLabel="확정"
        onConfirm={() => {
          if (!bestSlot) return;
          lockMeeting(meetingId);
          toast.success(`${bestSlot.date} ${slotToTime(bestSlot.slot)} 로 확정되었습니다.`);
        }}
      />
    </div>
  );
}

function MemberListPane({
  participants,
  meetingId,
  currentUserId,
  schedulesAll,
  onPick,
}: {
  participants: Member[];
  meetingId: string;
  currentUserId: string;
  schedulesAll: ReturnType<typeof useScheduleStore.getState>['schedules'];
  onPick: (m: Member) => void;
}) {
  return (
    <ul>
      {participants.map((m) => {
        const sched = schedulesAll[`${meetingId}__${m.id}`];
        const completed = sched?.completed === true;
        const partial = !!sched && !completed;
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onPick(m)}
              className="hover:bg-card border-border px-s-4 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
            >
              <MemberAvatar member={m} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-caption truncate font-semibold">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="text-accent text-micro ml-s-2 font-bold">나</span>
                  )}
                </div>
                <div className="text-foreground-muted text-micro truncate">{m.email ?? m.role}</div>
              </div>
              <span
                className={cn(
                  'text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold',
                  completed
                    ? 'bg-success-dim text-success'
                    : partial
                      ? 'bg-warn-dim text-warn'
                      : 'bg-card text-foreground-muted',
                )}
              >
                {completed ? '완료' : partial ? '입력 중' : '미입력'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SongListPane({
  songs,
  filter,
  onFilterChange,
  onPick,
}: {
  songs: Song[];
  filter: SongFilter;
  onFilterChange: (v: SongFilter) => void;
  onPick: (s: Song) => void;
}) {
  return (
    <div>
      <div className="border-border px-s-4 py-s-2 border-b">
        <UnderlineTabs<SongFilter>
          value={filter}
          onChange={onFilterChange}
          items={[
            { id: 'mine', label: '내 합주곡' },
            { id: 'all', label: '전체' },
          ]}
        />
      </div>
      <ul>
        {songs.length === 0 ? (
          <li className="text-foreground-muted py-s-8 text-caption text-center">
            {filter === 'mine' ? '내가 참여한 합주곡이 없습니다.' : '합주곡이 없습니다.'}
          </li>
        ) : (
          songs.map((song) => (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => onPick(song)}
                className="hover:bg-card border-border px-s-4 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-caption truncate font-bold">{song.title}</div>
                  <div className="text-foreground-muted text-micro truncate">
                    {song.artist}
                    {song.duration ? ` · ${song.duration}` : ''}
                  </div>
                </div>
                {isReady(song) && (
                  <span className="bg-success-dim text-success text-micro px-s-2 shrink-0 rounded-full py-0.5 font-bold">
                    합주 가능
                  </span>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function RightVisualization({
  panel,
  onClose,
  meetingId,
  visibleDays,
  participants,
  memberSchedules,
  view,
  songPool,
}: {
  panel: RightPanel;
  onClose: () => void;
  meetingId: string;
  visibleDays: string[];
  participants: Member[];
  memberSchedules: ReturnType<typeof useScheduleStore.getState>['schedules'][string][];
  view: ReturnType<typeof useScheduleViewUnit>;
  songPool: { id: string; title: string; artist?: string | null }[];
}) {
  const board = useBoardStore((s) => (panel?.kind === 'board' ? s.boards[panel.boardId] : null));
  if (!panel) {
    return (
      <div className="text-foreground-muted px-s-6 py-s-8 m-auto max-w-md text-center">
        <p className="text-body font-bold">좌측에서 항목을 선택하세요</p>
        <p className="text-caption mt-s-2">
          멤버 · 합주곡 · 시간표 시안을 선택하면 우측에 시각화가 표시됩니다.
        </p>
      </div>
    );
  }
  return (
    <>
      <header className="border-border px-s-5 py-s-3 gap-s-3 flex items-start justify-between border-b">
        <div className="min-w-0">
          <div className="text-foreground-muted text-micro font-bold uppercase">
            {panel.kind === 'member'
              ? '멤버 일정'
              : panel.kind === 'song'
                ? '곡 합주 가능 매트릭스'
                : '시간표 에디터'}
          </div>
          <div className="text-subtitle mt-s-1 truncate font-bold">
            {panel.kind === 'member'
              ? panel.member.name
              : panel.kind === 'song'
                ? panel.song.title
                : (board?.name ?? '시안')}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground-muted hover:text-foreground rounded-md p-1"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="px-s-5 py-s-3 border-border border-b">
        <ViewUnitToggle
          unit={view.unit}
          recommended={view.recommended}
          onChange={view.setUnit}
          onPrev={view.prev}
          onNext={view.next}
          onToday={view.today}
          anchorLabel={anchorLabelOf(view.unit, view.anchor)}
        />
      </div>
      <div className="px-s-5 py-s-4 flex-1 overflow-y-auto">
        {panel.kind === 'member' ? (
          <MemberSchedulePanel member={panel.member} meetingId={meetingId} allDays={visibleDays} />
        ) : panel.kind === 'song' ? (
          <SongMatrixPanel
            memberSchedules={memberSchedules}
            participants={participants}
            allDays={visibleDays}
          />
        ) : board ? (
          <ScheduleBoardEditor boardId={board.boardId} days={visibleDays} songPool={songPool} />
        ) : (
          <p className="text-foreground-muted text-caption">시안을 선택해주세요.</p>
        )}
      </div>
    </>
  );
}

function MemberSchedulePanel({
  member,
  meetingId,
  allDays,
}: {
  member: Member;
  meetingId: string;
  allDays: string[];
}) {
  const sched = useScheduleStore((s) => s.schedules[`${meetingId}__${member.id}`]);
  if (!sched) {
    return (
      <p className="text-foreground-muted text-caption">
        {member.name}님은 아직 일정을 입력하지 않았습니다.
      </p>
    );
  }
  return (
    <div className="gap-s-4 flex flex-col">
      <div>
        <div className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
          가능 일자 ({sched.availableDates.length}/{allDays.length})
        </div>
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((d) => {
            const ratio = (() => {
              const m = sched.blocks[d];
              if (!m || !sched.availableDates.includes(d)) return 0;
              const onCount = m.filter(Boolean).length;
              return onCount / 48;
            })();
            const tone = !sched.availableDates.includes(d)
              ? 'bg-card text-foreground-muted/40'
              : ratio === 0
                ? 'bg-card text-foreground-muted'
                : ratio < 0.3
                  ? 'bg-warn-dim text-warn'
                  : ratio < 0.7
                    ? 'bg-accent-dim text-accent'
                    : 'bg-success-dim text-success';
            return (
              <span
                key={d}
                title={`${d} — 가능 시간 ${Math.round(ratio * 100)}%`}
                className={cn(
                  'text-micro rounded-md px-1 py-1 text-center font-mono font-bold',
                  tone,
                )}
              >
                {d.slice(8)}
              </span>
            );
          })}
        </div>
      </div>
      {sched.note && (
        <div>
          <div className="text-foreground-muted text-micro mb-s-2 font-bold uppercase">
            특이사항
          </div>
          <p className="text-foreground text-caption leading-relaxed whitespace-pre-wrap">
            {sched.note}
          </p>
        </div>
      )}
      <div className="text-foreground-muted text-micro">
        {sched.completed ? '입력 완료' : '입력 중'} · 갱신{' '}
        {sched.updatedAt.slice(0, 16).replace('T', ' ')}
      </div>
    </div>
  );
}

function SongMatrixPanel({
  memberSchedules,
  participants,
  allDays,
}: {
  memberSchedules: ReturnType<typeof useScheduleStore.getState>['schedules'][string][];
  participants: Member[];
  allDays: string[];
}) {
  const aggregate = useMemo(
    () => aggregateAvailability(memberSchedules, allDays),
    [memberSchedules, allDays],
  );
  const totalParticipants = participants.length;
  return (
    <div className="gap-s-4 flex flex-col">
      <p className="text-foreground-muted text-caption">
        참여 {totalParticipants}명 기준 동시 가능한 시간 (셀이 진할수록 가능 인원이 많음).
      </p>
      <div className="overflow-x-auto">
        <table className="text-micro w-full text-left">
          <thead className="text-foreground-muted">
            <tr>
              <th className="px-1 py-1">일자</th>
              {[18, 22, 26, 30, 34, 38, 42].map((s) => (
                <th key={s} className="px-1 py-1 text-center">
                  {slotToTime(s)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allDays.slice(0, 14).map((d) => (
              <tr key={d} className="border-border border-t">
                <td className="px-1 py-1 font-mono">{d.slice(5)}</td>
                {[18, 22, 26, 30, 34, 38, 42].map((s) => {
                  const c = aggregate[d]?.[s] ?? 0;
                  const ratio = totalParticipants === 0 ? 0 : c / totalParticipants;
                  const tone =
                    ratio === 0
                      ? 'bg-card text-foreground-muted/30'
                      : ratio < 0.5
                        ? 'bg-warn-dim text-warn'
                        : ratio < 1
                          ? 'bg-accent-dim text-accent'
                          : 'bg-success-dim text-success';
                  return (
                    <td
                      key={s}
                      className={cn('px-1 py-1 text-center font-bold', tone)}
                      title={`${d} ${slotToTime(s)} — ${c}명 가능`}
                    >
                      {c || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function anchorLabelOf(unit: ViewUnit, anchor: string): string {
  if (unit === 'month') return anchor.slice(0, 7);
  if (unit === 'week') return `~${anchor}`;
  return anchor;
}
