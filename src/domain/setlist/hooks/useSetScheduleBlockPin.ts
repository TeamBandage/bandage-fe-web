import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { setScheduleBlockPin } from '../api';
import type { ScheduleBoardResponse } from '../types/res';

type Variables = { boardId: string; blockId: string; pinned: boolean };

export function useSetScheduleBlockPin(setlistId: string) {
  const qc = useQueryClient();
  const queryKey = queryKeys.setlist.scheduleBoards(setlistId);

  return useMutation({
    mutationFn: ({ boardId, blockId, pinned }: Variables) =>
      setScheduleBlockPin(setlistId, boardId, blockId, pinned),
    onMutate: async ({ boardId, blockId, pinned }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ScheduleBoardResponse[]>(queryKey);

      qc.setQueryData<ScheduleBoardResponse[]>(queryKey, (boards) =>
        boards?.map((board) =>
          board.boardId === boardId
            ? {
                ...board,
                blocks: board.blocks.map((b) => (b.blockId === blockId ? { ...b, pinned } : b)),
              }
            : board,
        ),
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
