'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/cn';

import { useScheduleViewStore } from '../store/scheduleViewStore';
import type { MemberSchedule } from '../types';
import { dayOfWeek, slotToTime } from '../utils';

import { MemberAvatar } from '@/domain/setlist-meeting/components/MemberAvatar';
import type { Member } from '@/domain/setlist-meeting/types';

interface Props {
  meetingId: string;
  participants: Member[];
  memberSchedules: MemberSchedule[];
  /** 곡별 가용시간 모드용 — 활성 시 해당 곡의 참여 멤버만 분류. */
  scopeUserIds?: string[] | 'ALL';
  className?: string;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 매트릭스 / 주차별 UI 공통 — 셀 호버 시 우측에 가능/불가능 인원 표시 (Task 23).
 * scheduleViewStore.hoveredCellByMeeting 을 구독하여 실시간 갱신.
 * 호버 떼도 마지막 상태 유지 — 깜빡임 방지.
 */
export function HoveredAvailabilityPanel({
  meetingId,
  participants,
  memberSchedules,
  scopeUserIds = 'ALL',
  className,
}: Props) {
  const cell = useScheduleViewStore((s) => s.hoveredCellByMeeting[meetingId] ?? null);

  const targetParticipants = useMemo(() => {
    if (scopeUserIds === 'ALL') return participants;
    const allow = new Set(scopeUserIds);
    return participants.filter((p) => allow.has(p.id));
  }, [participants, scopeUserIds]);

  const { available, unavailable } = useMemo(() => {
    if (!cell) return { available: [], unavailable: [] as Member[] };
    const ok: Member[] = [];
    const no: Member[] = [];
    for (const m of targetParticipants) {
      const sched = memberSchedules.find((s) => s.userId === m.id);
      const isAvailable = Boolean(
        sched && sched.availableDates.includes(cell.date) && sched.blocks[cell.date]?.[cell.slot],
      );
      if (isAvailable) ok.push(m);
      else no.push(m);
    }
    return { available: ok, unavailable: no };
  }, [cell, targetParticipants, memberSchedules]);

  return (
    <div className={cn('bg-card border-border flex flex-col rounded-md border', className)}>
      <header className="border-border px-s-3 py-s-2 border-b">
        <div className="text-foreground-muted text-micro font-bold uppercase">
          가능 / 불가능 인원
        </div>
        <div className="text-caption mt-0.5 font-mono">
          {cell
            ? `${cell.date} (${DOW[dayOfWeek(cell.date)]}) · ${slotToTime(cell.slot)}`
            : '셀 위에 마우스를 올려 시간을 선택'}
        </div>
        {scopeUserIds !== 'ALL' && (
          <div className="text-foreground-muted text-micro mt-0.5">
            기준: 선택된 곡 참여 멤버 ({targetParticipants.length}명)
          </div>
        )}
      </header>
      <div className="px-s-3 py-s-2 gap-s-3 flex flex-1 flex-col overflow-y-auto">
        <section>
          <div className="text-success text-micro mb-1 font-bold">가능 {available.length}명</div>
          <ul className="gap-s-1 flex flex-col">
            {available.map((m) => (
              <li key={m.id} className="gap-s-2 flex items-center">
                <MemberAvatar member={m} size="sm" />
                <span className="text-caption truncate">{m.name}</span>
              </li>
            ))}
            {available.length === 0 && cell && (
              <li className="text-foreground-muted text-micro">없음</li>
            )}
          </ul>
        </section>
        <section>
          <div className="text-danger text-micro mb-1 font-bold">불가능 {unavailable.length}명</div>
          <ul className="gap-s-1 flex flex-col">
            {unavailable.map((m) => (
              <li key={m.id} className="gap-s-2 flex items-center opacity-60">
                <MemberAvatar member={m} size="sm" />
                <span className="text-caption truncate">{m.name}</span>
              </li>
            ))}
            {unavailable.length === 0 && cell && (
              <li className="text-foreground-muted text-micro">없음</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
