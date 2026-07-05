import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSessionConfirmations } from '../api/updateSessionConfirmations';

type Args = { itemId: string; sessionId: string; confirm: number[]; unconfirm: number[] };

export function useUpdateSessionConfirmations(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, sessionId, confirm, unconfirm }: Args) =>
      updateSessionConfirmations(selectionId, itemId, sessionId, { confirm, unconfirm }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
