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
  lockedAt: string;
}

interface MatrixLockState {
  locksByMeeting: Record<string, LockedSlot[]>;
}

interface MatrixLockActions {
  addLock: (input: Omit<LockedSlot, 'id' | 'lockedAt'>) => LockedSlot;
  removeLock: (meetingId: string, lockId: string) => void;
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
