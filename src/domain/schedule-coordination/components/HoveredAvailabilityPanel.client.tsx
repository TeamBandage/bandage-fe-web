'use client';

import { useMemo } from 'react';

import { useScheduleViewStore } from '../store/scheduleViewStore';
import type { MemberSchedule } from '../types';
import { buildCoverageHeatmap } from '../utils/coverageHeatmap';

import type { Member } from '@/domain/setlist-meeting/types';

import { MemberAvailabilityPanel } from './MemberAvailabilityPanel.client';

interface Props {
  meetingId: string;
  participants: Member[];
  memberSchedules: MemberSchedule[];
  /** 곡별 가용시간 모드용 — 활성 시 해당 곡의 참여 멤버만 분류. */
  scopeUserIds?: string[] | 'ALL';
  /** 표시 시간 범위 — 매트릭스/주차별 UI 의 rangePreset 과 동일 값을 받음. */
  slotFrom?: number;
  slotTo?: number;
  /** 표시 일자 범위 — 보통 visibleDays 또는 allDays. */
  days: string[];
  className?: string;
}

/**
 * SchedulingMain 의 우측 사이드바용 wrapper. 매트릭스 SidePanel 과 동일한
 * MemberAvailabilityPanel 을 사용하되, 데이터(availability/cell/scope) 를
 * scheduleViewStore 와 props 로부터 합성하여 전달.
 */
export function HoveredAvailabilityPanel({
  meetingId,
  participants,
  memberSchedules,
  scopeUserIds = 'ALL',
  slotFrom = 18,
  slotTo = 44,
  days,
  className,
}: Props) {
  const cell = useScheduleViewStore((s) => s.hoveredCellByMeeting[meetingId] ?? null);

  const targetParticipants = useMemo(() => {
    if (scopeUserIds === 'ALL') return participants;
    const allow = new Set(scopeUserIds);
    return participants.filter((p) => allow.has(p.id));
  }, [participants, scopeUserIds]);

  const targetSchedules = useMemo(() => {
    if (scopeUserIds === 'ALL') return memberSchedules;
    const allow = new Set(scopeUserIds);
    return memberSchedules.filter((s) => allow.has(s.userId));
  }, [memberSchedules, scopeUserIds]);

  const availability = useMemo(
    () =>
      buildCoverageHeatmap({
        memberSchedules: targetSchedules,
        allDays: days,
        slotFrom,
        slotTo,
        scope: 'ALL',
      }),
    [targetSchedules, days, slotFrom, slotTo],
  );

  return (
    <MemberAvailabilityPanel
      cell={cell}
      availability={availability}
      participants={targetParticipants}
      memberSchedules={targetSchedules}
      className={className}
      placeholder={'셀을 클릭하면\n해당 시간의 멤버 가용성이 표시됩니다.'}
    />
  );
}
