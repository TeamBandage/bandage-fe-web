import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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

export const useScheduleStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      schedules: {},

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
      name: 'bandage-schedule',
      // 사용자가 실수로 나갔다 들어와도 입력이 유지되도록 localStorage 영속화.
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
    },
  ),
);

export { emptyMask, keyOf };
