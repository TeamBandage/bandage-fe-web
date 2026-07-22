import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateScheduleBoard } from '../api';
import type { ScheduleBoardUpdateRequest } from '../types/req';

export function useUpdateScheduleBoard(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, body }: { boardId: string; body: ScheduleBoardUpdateRequest }) =>
      updateScheduleBoard(setlistId, boardId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.scheduleBoards(setlistId) });
    },
  });
}
