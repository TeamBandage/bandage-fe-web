import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteTrackSelectionItem } from '../api/deleteTrackSelectionItem';

export function useDeleteTrackSelectionItem(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteTrackSelectionItem(selectionId, itemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
