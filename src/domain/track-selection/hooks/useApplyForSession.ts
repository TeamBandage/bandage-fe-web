import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { applyForSession } from '../api/applyForSession';

export function useApplyForSession(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, sessionId }: { itemId: string; sessionId: string }) =>
      applyForSession(selectionId, itemId, sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
