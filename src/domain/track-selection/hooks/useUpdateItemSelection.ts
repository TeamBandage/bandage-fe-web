import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateItemSelection } from '../api/updateItemSelection';

export function useUpdateItemSelection(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, selected }: { itemId: string; selected: boolean }) =>
      updateItemSelection(selectionId, itemId, { selected }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
