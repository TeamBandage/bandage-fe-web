'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateTrackSelection } from '../api/updateTrackSelection';

export function useUpdateTrackSelection(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateTrackSelection(selectionId, { title }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.detail(selectionId) });
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.my() });
    },
  });
}
