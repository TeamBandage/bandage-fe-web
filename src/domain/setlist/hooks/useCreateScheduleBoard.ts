import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createScheduleBoard } from '../api';
import type { ScheduleBoardCreateRequest } from '../types/req';

export function useCreateScheduleBoard(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleBoardCreateRequest) => createScheduleBoard(setlistId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.scheduleBoards(setlistId) });
    },
  });
}
