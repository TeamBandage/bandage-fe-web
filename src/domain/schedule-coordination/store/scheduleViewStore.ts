import { create } from 'zustand';

import type { RangePreset } from '../components/rangePresets';

/**
 * 합주 일정 조율 v3 — 주차별 UI / 매트릭스가 공유하는 뷰 상태.
 * 회의 단위로 키잉. 의도적으로 persist 하지 않음 — 페이지 진입 시 초기화.
 */
export type ScheduleViewMode = 'weekly' | 'matrix';

export interface ScheduleViewState {
  /** 회의 → 모드. */
  modeByMeeting: Record<string, ScheduleViewMode>;
  /** 회의 → 선택 주차 시작일(월요일). 자동 시간표 생성 / 주별 복제의 기준. */
  selectedWeekStartByMeeting: Record<string, string>;
  /** 회의 → 곡별 가용시간 모드용 lock id. null = 전체 멤버 모드. */
  focusedLockIdByMeeting: Record<string, string | null>;
  /** 회의 → 호버 중인 셀(인원 패널 갱신용). */
  hoveredCellByMeeting: Record<string, { date: string; slot: number } | null>;
  /** 회의 → 주별 복제: 복제 대상으로 선택된 주차 시작일들. 빈 배열 = 선택 모드 미진입. */
  repeatTargetsByMeeting: Record<string, string[]>;
  /** 회의 → 주별 복제 모드 진입 여부. */
  repeatActiveByMeeting: Record<string, boolean>;
  /** 회의 → 표출 시간 프리셋 ('9-22' | '24h'). 주차별/매트릭스 공유. */
  rangePresetByMeeting: Record<string, RangePreset>;
}

interface ScheduleViewActions {
  setMode: (meetingId: string, mode: ScheduleViewMode) => void;
  setSelectedWeekStart: (meetingId: string, weekStart: string) => void;
  setFocusedLockId: (meetingId: string, lockId: string | null) => void;
  /** 같은 lockId 면 토글, 다른 lockId 면 교체. */
  toggleFocusedLockId: (meetingId: string, lockId: string) => void;
  setHoveredCell: (meetingId: string, cell: { date: string; slot: number } | null) => void;
  enterRepeatMode: (meetingId: string) => void;
  exitRepeatMode: (meetingId: string) => void;
  toggleRepeatTarget: (meetingId: string, weekStart: string) => void;
  clearRepeatTargets: (meetingId: string) => void;
  setRangePreset: (meetingId: string, preset: RangePreset) => void;
  reset: () => void;
}

export const useScheduleViewStore = create<ScheduleViewState & ScheduleViewActions>()((set) => ({
  modeByMeeting: {},
  selectedWeekStartByMeeting: {},
  focusedLockIdByMeeting: {},
  hoveredCellByMeeting: {},
  repeatTargetsByMeeting: {},
  repeatActiveByMeeting: {},
  rangePresetByMeeting: {},

  setMode: (meetingId, mode) =>
    set((s) => ({ modeByMeeting: { ...s.modeByMeeting, [meetingId]: mode } })),

  setSelectedWeekStart: (meetingId, weekStart) =>
    set((s) => ({
      selectedWeekStartByMeeting: { ...s.selectedWeekStartByMeeting, [meetingId]: weekStart },
    })),

  setFocusedLockId: (meetingId, lockId) =>
    set((s) => ({
      focusedLockIdByMeeting: { ...s.focusedLockIdByMeeting, [meetingId]: lockId },
    })),

  toggleFocusedLockId: (meetingId, lockId) =>
    set((s) => {
      const cur = s.focusedLockIdByMeeting[meetingId] ?? null;
      const next = cur === lockId ? null : lockId;
      return {
        focusedLockIdByMeeting: { ...s.focusedLockIdByMeeting, [meetingId]: next },
      };
    }),

  setHoveredCell: (meetingId, cell) =>
    set((s) => ({ hoveredCellByMeeting: { ...s.hoveredCellByMeeting, [meetingId]: cell } })),

  enterRepeatMode: (meetingId) =>
    set((s) => ({
      repeatActiveByMeeting: { ...s.repeatActiveByMeeting, [meetingId]: true },
      repeatTargetsByMeeting: { ...s.repeatTargetsByMeeting, [meetingId]: [] },
    })),

  exitRepeatMode: (meetingId) =>
    set((s) => ({
      repeatActiveByMeeting: { ...s.repeatActiveByMeeting, [meetingId]: false },
      repeatTargetsByMeeting: { ...s.repeatTargetsByMeeting, [meetingId]: [] },
    })),

  toggleRepeatTarget: (meetingId, weekStart) =>
    set((s) => {
      const cur = s.repeatTargetsByMeeting[meetingId] ?? [];
      const next = cur.includes(weekStart)
        ? cur.filter((w) => w !== weekStart)
        : [...cur, weekStart];
      return { repeatTargetsByMeeting: { ...s.repeatTargetsByMeeting, [meetingId]: next } };
    }),

  clearRepeatTargets: (meetingId) =>
    set((s) => ({ repeatTargetsByMeeting: { ...s.repeatTargetsByMeeting, [meetingId]: [] } })),

  setRangePreset: (meetingId, preset) =>
    set((s) => ({ rangePresetByMeeting: { ...s.rangePresetByMeeting, [meetingId]: preset } })),

  reset: () =>
    set({
      modeByMeeting: {},
      selectedWeekStartByMeeting: {},
      focusedLockIdByMeeting: {},
      hoveredCellByMeeting: {},
      repeatTargetsByMeeting: {},
      repeatActiveByMeeting: {},
      rangePresetByMeeting: {},
    }),
}));
