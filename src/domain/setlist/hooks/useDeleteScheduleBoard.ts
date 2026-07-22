import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteScheduleBoard } from '../api';

export function useDeleteScheduleBoard(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => deleteScheduleBoard(setlistId, boardId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.scheduleBoards(setlistId) });
    },
  });
}
