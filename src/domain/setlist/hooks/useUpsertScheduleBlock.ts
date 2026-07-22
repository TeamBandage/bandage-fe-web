import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { upsertScheduleBlock } from '../api';
import type { ScheduleBlockUpsertRequest } from '../types/req';
import type { ScheduleBoardResponse } from '../types/res';

type Variables = {
  boardId: string;
  blockId: string;
  body: ScheduleBlockUpsertRequest;
};

/** 드래그 배치/이동 — 캐시를 낙관적으로 먼저 바꾸고, 실패 시 롤백. */
export function useUpsertScheduleBlock(setlistId: string) {
  const qc = useQueryClient();
  const queryKey = queryKeys.setlist.scheduleBoards(setlistId);

  return useMutation({
    mutationFn: ({ boardId, blockId, body }: Variables) =>
      upsertScheduleBlock(setlistId, boardId, blockId, body),
    onMutate: async ({ boardId, blockId, body }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ScheduleBoardResponse[]>(queryKey);

      qc.setQueryData<ScheduleBoardResponse[]>(queryKey, (boards) =>
        boards?.map((board) => {
          if (board.boardId !== boardId) return board;
          const exists = board.blocks.some((b) => b.blockId === blockId);
          const blocks = exists
            ? board.blocks.map((b) =>
                b.blockId === blockId
                  ? {
                      ...b,
                      startDate: body.startDate,
                      startSlot: body.startSlot,
                      endDate: body.endDate,
                      endSlot: body.endSlot,
                      trackIds: body.trackIds,
                      pinned: body.pinned ?? b.pinned,
                      title: body.title ?? b.title,
                      note: body.note ?? b.note,
                      recurrence: body.recurrence ?? b.recurrence,
                    }
                  : b,
              )
            : [
                ...board.blocks,
                {
                  blockId,
                  startDate: body.startDate,
                  startSlot: body.startSlot,
                  endDate: body.endDate,
                  endSlot: body.endSlot,
                  trackIds: body.trackIds,
                  pinned: body.pinned ?? false,
                  placementOrigin: 'MANUAL' as const,
                  recurrence: { freq: 'NONE' as const, interval: 1 },
                  note: body.note,
                  title: body.title,
                },
              ];
          return { ...board, blocks };
        }),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}
