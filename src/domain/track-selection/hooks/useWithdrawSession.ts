import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { withdrawSessionApplication } from '../api/withdrawSessionApplication';

export function useWithdrawSession(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      sessionId,
      userId,
    }: {
      itemId: string;
      sessionId: string;
      userId: number;
    }) => withdrawSessionApplication(selectionId, itemId, sessionId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
