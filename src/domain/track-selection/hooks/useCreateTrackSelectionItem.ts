import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createTrackSelectionItem } from '../api/createTrackSelectionItem';
import type { TrackSelectionItemCreateRequest } from '../types/req';

export function useCreateTrackSelectionItem(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TrackSelectionItemCreateRequest) =>
      createTrackSelectionItem(selectionId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.items(selectionId) });
    },
  });
}
