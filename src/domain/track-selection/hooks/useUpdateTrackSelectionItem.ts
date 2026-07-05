import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateTrackSelectionItem } from '../api/updateTrackSelectionItem';
import type { TrackSelectionItemUpdateRequest } from '../types/req';

export function useUpdateTrackSelectionItem(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: TrackSelectionItemUpdateRequest }) =>
      updateTrackSelectionItem(selectionId, itemId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
