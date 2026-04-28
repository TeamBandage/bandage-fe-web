import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

interface TimetableState {
  /** meetingId → 매니저 확정 여부. true 면 진행도 게이지가 success(green) 톤으로 전환. */
  confirmedByMeetingId: Record<string, boolean>;
}

interface TimetableActions {
  setConfirmed: (meetingId: string, confirmed: boolean) => void;
  isConfirmed: (meetingId: string) => boolean;
  reset: () => void;
}

export const useTimetableStore = create<TimetableState & TimetableActions>()(
  persist(
    (set, get) => ({
      confirmedByMeetingId: {},
      setConfirmed: (meetingId, confirmed) =>
        set((s) => ({
          confirmedByMeetingId: { ...s.confirmedByMeetingId, [meetingId]: confirmed },
        })),
      isConfirmed: (meetingId) => Boolean(get().confirmedByMeetingId[meetingId]),
      reset: () => set({ confirmedByMeetingId: {} }),
    }),
    {
      name: 'bandage-timetable-v1',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
    },
  ),
);
