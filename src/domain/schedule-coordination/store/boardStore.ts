import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ScheduleBlock, ScheduleBoard, ScheduleBoardConstraints } from '../types';

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const MAX_BOARDS_PER_MEETING = 5;

export const SCHEDULE_BOARD_LIMIT = MAX_BOARDS_PER_MEETING;

interface BoardState {
  boards: Record<string, ScheduleBoard>;
}

interface BoardActions {
  getBoardsByMeeting: (meetingId: string) => ScheduleBoard[];
  createBoard: (input: {
    meetingId: string;
    name: string;
    blocks?: ScheduleBlock[];
    paletteSeed?: number;
  }) => ScheduleBoard | null;
  updateBoard: (
    boardId: string,
    patch: Partial<Omit<ScheduleBoard, 'boardId' | 'meetingId'>>,
  ) => void;
  renameBoard: (boardId: string, name: string) => void;
  deleteBoard: (boardId: string) => void;
  /** Task 5 사전 — 단일 블록 추가/이동/삭제. */
  upsertBlock: (boardId: string, block: ScheduleBlock) => void;
  removeBlock: (boardId: string, blockId: string) => void;
  /** Task 13 — 잠금 토글. */
  togglePin: (boardId: string, blockId: string) => void;
  /** Task 13 — Working Hours 등 board 제약 갱신. */
  setConstraints: (boardId: string, c: ScheduleBoardConstraints) => void;
  /** Task 13 — 블록 일괄 교체 (auto-reschedule 결과 적용). */
  replaceBlocks: (boardId: string, blocks: ScheduleBlock[]) => void;
  /** Task 8 — 시안 확정 (다른 시안의 confirmed 는 false 로). */
  confirmBoard: (boardId: string) => void;
  unconfirmAll: (meetingId: string) => void;
  reset: () => void;
}

const newId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;

export const useBoardStore = create<BoardState & BoardActions>()(
  persist(
    (set, get) => ({
      boards: {},

      getBoardsByMeeting: (meetingId) =>
        Object.values(get().boards)
          .filter((b) => b.meetingId === meetingId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),

      createBoard: ({ meetingId, name, blocks, paletteSeed }) => {
        const existing = get().getBoardsByMeeting(meetingId);
        if (existing.length >= MAX_BOARDS_PER_MEETING) return null;
        const now = new Date().toISOString();
        const board: ScheduleBoard = {
          boardId: newId('brd'),
          meetingId,
          name,
          blocks: blocks ?? [],
          pinned: [],
          paletteSeed: paletteSeed ?? existing.length,
          confirmed: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ boards: { ...s.boards, [board.boardId]: board } }));
        return board;
      },

      updateBoard: (boardId, patch) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, ...patch, updatedAt: new Date().toISOString() },
            },
          };
        }),

      renameBoard: (boardId, name) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, name, updatedAt: new Date().toISOString() },
            },
          };
        }),

      deleteBoard: (boardId) =>
        set((s) => {
          if (!s.boards[boardId]) return s;
          const next = { ...s.boards };
          delete next[boardId];
          return { boards: next };
        }),

      upsertBlock: (boardId, block) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          const idx = cur.blocks.findIndex((b) => b.blockId === block.blockId);
          const blocks =
            idx === -1
              ? [...cur.blocks, block]
              : cur.blocks.map((b) => (b.blockId === block.blockId ? block : b));
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, blocks, updatedAt: new Date().toISOString() },
            },
          };
        }),

      removeBlock: (boardId, blockId) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: {
                ...cur,
                blocks: cur.blocks.filter((b) => b.blockId !== blockId),
                pinned: cur.pinned.filter((id) => id !== blockId),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      togglePin: (boardId, blockId) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          const has = cur.pinned.includes(blockId);
          const pinned = has ? cur.pinned.filter((id) => id !== blockId) : [...cur.pinned, blockId];
          const blocks = cur.blocks.map((b) =>
            b.blockId === blockId ? { ...b, pinned: !has } : b,
          );
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, pinned, blocks, updatedAt: new Date().toISOString() },
            },
          };
        }),

      setConstraints: (boardId, c) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, constraints: c, updatedAt: new Date().toISOString() },
            },
          };
        }),

      replaceBlocks: (boardId, blocks) =>
        set((s) => {
          const cur = s.boards[boardId];
          if (!cur) return s;
          return {
            boards: {
              ...s.boards,
              [boardId]: { ...cur, blocks, updatedAt: new Date().toISOString() },
            },
          };
        }),

      confirmBoard: (boardId) =>
        set((s) => {
          const target = s.boards[boardId];
          if (!target) return s;
          const next: Record<string, ScheduleBoard> = {};
          const ts = new Date().toISOString();
          for (const id of Object.keys(s.boards)) {
            const b = s.boards[id]!;
            if (b.meetingId !== target.meetingId) {
              next[id] = b;
            } else {
              next[id] = { ...b, confirmed: id === boardId, updatedAt: ts };
            }
          }
          return { boards: next };
        }),

      unconfirmAll: (meetingId) =>
        set((s) => {
          const next: Record<string, ScheduleBoard> = {};
          const ts = new Date().toISOString();
          for (const id of Object.keys(s.boards)) {
            const b = s.boards[id]!;
            next[id] = b.meetingId === meetingId ? { ...b, confirmed: false, updatedAt: ts } : b;
          }
          return { boards: next };
        }),

      reset: () => set({ boards: {} }),
    }),
    {
      name: 'bandage-schedule-boards-v1',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
    },
  ),
);

export { newId as newBoardScopedId };
