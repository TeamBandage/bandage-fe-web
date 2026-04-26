'use client';

import { CalendarDays, CheckCircle2, Clock3, Crown, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { GLOBAL_MEMBER_POOL } from '@/domain/setlist-meeting/mock/memberSearchMock';
import { MemberAvatar } from '@/domain/setlist-meeting/components/MemberAvatar';
import { useSetlistStore } from '@/domain/setlist-meeting/store/setlistStore';
import type { Member, Song } from '@/domain/setlist-meeting/types';
import { isReady } from '@/domain/setlist-meeting/utils';
import { useScheduleStore } from '@/domain/schedule-coordination/store/scheduleStore';
import {
  aggregateAvailability,
  enumerateDays,
  slotToTime,
} from '@/domain/schedule-coordination/utils';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { ScheduleInputModal } from './ScheduleInputModal.client';

type SongFilter = 'mine' | 'all';
type RightPanel = { kind: 'member'; member: Member } | { kind: 'song'; song: Song } | null;

export function SchedulingMain({ meetingId }: { meetingId: string }) {
  const meetings = useSetlistStore((s) => s.meetings);
  const songs = useSetlistStore((s) => s.songs);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const meeting = useMemo(() => meetings.find((m) => m.id === meetingId), [meetings, meetingId]);
  const allSongs = useMemo(
    () => songs.filter((s) => s.meetingId === meetingId),
    [songs, meetingId],
  );

  // 모든 hook 은 early-return 위에 호출(rules-of-hooks).
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

  const [songFilter, setSongFilter] = useState<SongFilter>('mine');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const lockMeeting = useSetlistStore((s) => s.lockMeeting);

  // 곡 필터 — 내 합주곡(내가 지원/확정된 곡) vs 전체 (확정 우선)
  const visibleSongs = useMemo<Song[]>(() => {
    const ready = allSongs.filter((s) => isReady(s));
    const pool = ready.length > 0 ? ready : allSongs; // 확정 곡이 없으면 전체
    if (songFilter === 'all') return pool;
    return pool.filter(
      (s) =>
        Object.values(s.applicants).some((list) => list.includes(currentUserId)) ||
        Object.values(s.confirmed).some((list) => list.includes(currentUserId)),
    );
  }, [allSongs, songFilter, currentUserId]);

  const window = meeting?.practiceWindow;
  const allDays = useMemo(() => (window ? enumerateDays(window.from, window.to) : []), [window]);

  // 매니저 확정 — 가장 동시 가능 인원이 많은 슬롯 자동 추천.
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

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
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
          {meeting.confirmedSlot && (
            <span className="bg-success-dim text-success px-s-2 text-micro rounded-full py-0.5 font-bold">
              합주 일정 확정 {meeting.confirmedSlot.date}{' '}
              {slotToTime(meeting.confirmedSlot.startMin / 30)}
            </span>
          )}
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

      {/* Main split — md 이상 좌우 절반, 모바일 세로 */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* 멤버 리스트 */}
        <section className="border-border flex-1 overflow-y-auto md:border-r">
          <div className="px-s-5 py-s-3 border-border border-b">
            <h2 className="text-foreground text-body font-bold">
              참여 멤버 ({participants.length})
            </h2>
          </div>
          <ul>
            {participants.map((m) => {
              const sched = schedulesAll[`${meetingId}__${m.id}`];
              const completed = sched?.completed === true;
              const partial = !!sched && !completed;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setRightPanel({ kind: 'member', member: m })}
                    className="hover:bg-card border-border px-s-5 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
                  >
                    <MemberAvatar member={m} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-caption truncate font-semibold">
                        {m.name}
                        {m.id === currentUserId && (
                          <span className="text-accent text-micro ml-s-2 font-bold">나</span>
                        )}
                      </div>
                      <div className="text-foreground-muted text-micro truncate">
                        {m.email ?? m.role}
                      </div>
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
        </section>

        {/* 곡 리스트 */}
        <section className="flex-1 overflow-y-auto">
          <div className="px-s-5 py-s-3 border-border gap-s-3 flex items-center justify-between border-b">
            <h2 className="text-foreground text-body font-bold">합주곡 ({visibleSongs.length})</h2>
            <UnderlineTabs
              value={songFilter}
              onChange={(v) => setSongFilter(v as SongFilter)}
              items={[
                { id: 'mine', label: '내 합주곡' },
                { id: 'all', label: '전체' },
              ]}
            />
          </div>
          <ul>
            {visibleSongs.length === 0 ? (
              <li className="text-foreground-muted py-s-8 text-caption text-center">
                {songFilter === 'mine' ? '내가 참여한 합주곡이 없습니다.' : '합주곡이 없습니다.'}
              </li>
            ) : (
              visibleSongs.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => setRightPanel({ kind: 'song', song })}
                    className="hover:bg-card border-border px-s-5 py-s-3 gap-s-3 flex w-full items-center border-b text-left"
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
        </section>
      </div>

      {/* 우측 상세 패널 — overlay */}
      {rightPanel && (
        <aside
          className="bg-surface border-border absolute top-0 right-0 bottom-0 z-20 hidden w-[380px] flex-col border-l shadow-lg lg:flex"
          aria-label="상세 패널"
        >
          <header className="border-border px-s-5 py-s-4 gap-s-3 flex items-start justify-between border-b">
            <div className="min-w-0">
              <div className="text-foreground-muted text-micro font-bold uppercase">
                {rightPanel.kind === 'member' ? '멤버 일정' : '곡 합주 가능 매트릭스'}
              </div>
              <div className="text-subtitle mt-s-1 truncate font-bold">
                {rightPanel.kind === 'member' ? rightPanel.member.name : rightPanel.song.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRightPanel(null)}
              className="text-foreground-muted hover:text-foreground rounded-md p-1"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="px-s-5 py-s-4 flex-1 overflow-y-auto">
            {rightPanel.kind === 'member' ? (
              <MemberSchedulePanel
                member={rightPanel.member}
                meetingId={meetingId}
                allDays={allDays}
              />
            ) : (
              <SongMatrixPanel
                memberSchedules={memberSchedules}
                participants={participants}
                allDays={allDays}
              />
            )}
          </div>
        </aside>
      )}

      {/* 나의 스케줄 입력 모달 */}
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
          // 회의 매니저 확정과 별개로, 합주 일정 슬롯 저장. 추후 BE 도입 시 별도 API.
          // mvp: lockMeeting 트리거 + meeting.confirmedSlot 은 store 직접 업데이트가 필요 → 일단 toast 만.
          lockMeeting(meetingId);
          toast.success(`${bestSlot.date} ${slotToTime(bestSlot.slot)} 로 확정되었습니다.`);
        }}
      />
    </div>
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
        참여 {totalParticipants}명 기준 동시 가능한 시간(셀이 진할수록 가능 인원이 많음).
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

function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: ReadonlyArray<{ id: T; label: string }>;
}) {
  return (
    <div className="border-border gap-s-4 -mb-px flex">
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'pb-s-1 text-caption border-b-2 font-semibold transition-colors',
              active
                ? 'border-accent text-accent'
                : 'text-foreground-muted hover:text-foreground border-transparent',
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
