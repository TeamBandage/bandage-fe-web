import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** 매트릭스 뷰에서 매니저가 확정·잠근 합주 슬롯. */
export interface LockedSlot {
  id: string;
  meetingId: string;
  date: string;
  /** 시작 슬롯 (0-47, 30분 단위). */
  startSlot: number;
  /** 끝 슬롯 (exclusive). */
  endSlot: number;
  /** 어느 곡에 대한 합주인지 (옵션 — v1 은 곡 미지정 가능). */
  songId?: string;
  /** 편집 다이얼로그용 메모 (Task 19). */
  note?: string;
  /** 표시용 곡 제목 오버라이드 (Task 19). */
  songTitleOverride?: string;
  lockedAt: string;
}

interface MatrixLockState {
  locksByMeeting: Record<string, LockedSlot[]>;
}

interface MatrixLockActions {
  addLock: (input: Omit<LockedSlot, 'id' | 'lockedAt'>) => LockedSlot;
  removeLock: (meetingId: string, lockId: string) => void;
  /** 부분 갱신 — songId, note, songTitleOverride 등. 길이 변경은 replaceLocks(reflow) 권장. */
  updateLock: (
    meetingId: string,
    lockId: string,
    patch: Partial<Omit<LockedSlot, 'id' | 'meetingId' | 'lockedAt'>>,
  ) => void;
  /** auto-reschedule 결과 일괄 반영용. */
  replaceLocks: (meetingId: string, locks: LockedSlot[]) => void;
  reset: () => void;
}

const newId = () => `lock_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

export const useMatrixLockStore = create<MatrixLockState & MatrixLockActions>()(
  persist(
    (set) => ({
      locksByMeeting: {},

      addLock: (input) => {
        const lock: LockedSlot = {
          ...input,
          id: newId(),
          lockedAt: new Date().toISOString(),
        };
        set((s) => ({
          locksByMeeting: {
            ...s.locksByMeeting,
            [input.meetingId]: [...(s.locksByMeeting[input.meetingId] ?? []), lock],
          },
        }));
        return lock;
      },

      removeLock: (meetingId, lockId) =>
        set((s) => ({
          locksByMeeting: {
            ...s.locksByMeeting,
            [meetingId]: (s.locksByMeeting[meetingId] ?? []).filter((l) => l.id !== lockId),
          },
        })),

      updateLock: (meetingId, lockId, patch) =>
        set((s) => ({
          locksByMeeting: {
            ...s.locksByMeeting,
            [meetingId]: (s.locksByMeeting[meetingId] ?? []).map((l) =>
              l.id === lockId ? { ...l, ...patch } : l,
            ),
          },
        })),

      replaceLocks: (meetingId, locks) =>
        set((s) => ({
          locksByMeeting: { ...s.locksByMeeting, [meetingId]: locks },
        })),

      reset: () => set({ locksByMeeting: {} }),
    }),
    {
      name: 'bandage-matrix-locks-v1',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
    },
  ),
);
