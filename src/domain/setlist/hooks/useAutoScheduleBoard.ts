import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { autoScheduleBoard } from '../api';
import type { ScheduleAutoScheduleRequest } from '../types/req';
import type { ScheduleBoardResponse } from '../types/res';

type Variables = {
  boardId: string;
  body: ScheduleAutoScheduleRequest;
};

/** 자동 배치 — 응답으로 받은 보드(갱신된 블록 포함)를 캐시에 그대로 반영하고, 재검증한다. */
export function useAutoScheduleBoard(setlistId: string) {
  const qc = useQueryClient();
  const queryKey = queryKeys.setlist.scheduleBoards(setlistId);

  return useMutation({
    mutationFn: ({ boardId, body }: Variables) => autoScheduleBoard(setlistId, boardId, body),
    onSuccess: (board) => {
      qc.setQueryData<ScheduleBoardResponse[]>(queryKey, (boards) =>
        boards?.map((b) => (b.boardId === board.boardId ? board : b)),
      );
      void qc.invalidateQueries({ queryKey });
    },
  });
}
