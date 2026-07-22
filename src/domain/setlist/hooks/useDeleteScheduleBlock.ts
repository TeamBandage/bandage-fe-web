import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteScheduleBlock } from '../api';
import type { ScheduleBoardResponse } from '../types/res';

type Variables = { boardId: string; blockId: string };

export function useDeleteScheduleBlock(setlistId: string) {
  const qc = useQueryClient();
  const queryKey = queryKeys.setlist.scheduleBoards(setlistId);

  return useMutation({
    mutationFn: ({ boardId, blockId }: Variables) =>
      deleteScheduleBlock(setlistId, boardId, blockId),
    onMutate: async ({ boardId, blockId }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ScheduleBoardResponse[]>(queryKey);

      qc.setQueryData<ScheduleBoardResponse[]>(queryKey, (boards) =>
        boards?.map((board) =>
          board.boardId === boardId
            ? { ...board, blocks: board.blocks.filter((b) => b.blockId !== blockId) }
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
