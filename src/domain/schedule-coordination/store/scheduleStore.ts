import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_SCHEDULES } from '../mock/scheduleSeed';
import type { MemberSchedule, SlotMask } from '../types';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

type Key = string; // `${meetingId}__${userId}`

const keyOf = (meetingId: string, userId: string): Key => `${meetingId}__${userId}`;

interface State {
  /** meetingId__userId → schedule. localStorage 영속화로 새로고침/재진입에도 유지. */
  schedules: Record<Key, MemberSchedule>;
}

interface Actions {
  getSchedule: (meetingId: string, userId: string) => MemberSchedule | undefined;
  upsertSchedule: (s: MemberSchedule) => void;
  toggleAvailableDate: (meetingId: string, userId: string, date: string) => void;
  setBlocks: (meetingId: string, userId: string, date: string, mask: SlotMask) => void;
  setNote: (meetingId: string, userId: string, note: string) => void;
  setCompleted: (meetingId: string, userId: string, completed: boolean) => void;
  reset: () => void;
}

const emptyMask = (): SlotMask => Array.from({ length: 48 }, () => false);

/** 9:00~22:00 (= slot 18~43) 기본 활성 마스크 — '나의 스케줄 입력' Step 2 진입 기본값. */
export const DEFAULT_DAY_MASK: SlotMask = Array.from({ length: 48 }, (_, i) => i >= 18 && i < 44);

const ensureSchedule = (state: State, meetingId: string, userId: string): MemberSchedule => {
  const k = keyOf(meetingId, userId);
  return (
    state.schedules[k] ?? {
      meetingId,
      userId,
      availableDates: [],
      unavailableDates: [],
      blocks: {},
      note: '',
      completed: false,
      updatedAt: new Date().toISOString(),
    }
  );
};

/** 개발자 검토용 mock 시드 — fresh localStorage 일 때만 적용. */
const SEEDED_SCHEDULES: Record<Key, MemberSchedule> = Object.fromEntries(
  SEED_SCHEDULES.map((s) => [keyOf(s.meetingId, s.userId), s]),
);

export const useScheduleStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      schedules: SEEDED_SCHEDULES,

      getSchedule: (meetingId, userId) => get().schedules[keyOf(meetingId, userId)],

      upsertSchedule: (s) =>
        set((state) => ({
          schedules: { ...state.schedules, [keyOf(s.meetingId, s.userId)]: s },
        })),

      toggleAvailableDate: (meetingId, userId, date) =>
        set((state) => {
          const current = ensureSchedule(state, meetingId, userId);
          const isAvailable = current.availableDates.includes(date);
          const next: MemberSchedule = isAvailable
            ? {
                ...current,
                availableDates: current.availableDates.filter((d) => d !== date),
                unavailableDates: [...current.unavailableDates.filter((d) => d !== date), date],
                updatedAt: new Date().toISOString(),
              }
            : {
                ...current,
                availableDates: [...current.availableDates, date],
                unavailableDates: current.unavailableDates.filter((d) => d !== date),
                updatedAt: new Date().toISOString(),
              };
          return {
            schedules: { ...state.schedules, [keyOf(meetingId, userId)]: next },
          };
        }),

      setBlocks: (meetingId, userId, date, mask) =>
        set((state) => {
          const current = ensureSchedule(state, meetingId, userId);
          const next: MemberSchedule = {
            ...current,
            blocks: { ...current.blocks, [date]: mask },
            updatedAt: new Date().toISOString(),
          };
          return {
            schedules: { ...state.schedules, [keyOf(meetingId, userId)]: next },
          };
        }),

      setNote: (meetingId, userId, note) =>
        set((state) => {
          const current = ensureSchedule(state, meetingId, userId);
          const next: MemberSchedule = {
            ...current,
            note,
            updatedAt: new Date().toISOString(),
          };
          return {
            schedules: { ...state.schedules, [keyOf(meetingId, userId)]: next },
          };
        }),

      setCompleted: (meetingId, userId, completed) =>
        set((state) => {
          const current = ensureSchedule(state, meetingId, userId);
          const next: MemberSchedule = {
            ...current,
            completed,
            updatedAt: new Date().toISOString(),
          };
          return {
            schedules: { ...state.schedules, [keyOf(meetingId, userId)]: next },
          };
        }),

      reset: () => set({ schedules: {} }),
    }),
    {
      // -v2: 시드 도입으로 기존 캐시 무효화.
      name: 'bandage-schedule-v2',
      // 사용자가 실수로 나갔다 들어와도 입력이 유지되도록 localStorage 영속화.
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
    },
  ),
);

export { emptyMask, keyOf };

/**
 * 회의별 일정 입력 진행도 — 참여자 중 `completed=true` 멤버 수 / 전체.
 * Task 1 master-detail 좌측 패널 게이지에 사용.
 * Task 8 시간표 확정(confirmed) 시 색상 전환은 별도 store 에서 관리.
 */
export function selectSchedulingProgress(
  schedules: Record<Key, MemberSchedule>,
  meetingId: string,
  participantUserIds: readonly string[],
): { total: number; completed: number; pct: number } {
  const total = participantUserIds.length;
  if (total === 0) return { total: 0, completed: 0, pct: 0 };
  const completed = participantUserIds.filter(
    (uid) => schedules[keyOf(meetingId, uid)]?.completed,
  ).length;
  return { total, completed, pct: Math.round((completed / total) * 100) };
}
