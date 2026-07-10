'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteTrackSelection } from '../api/deleteTrackSelection';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteTrackSelection(selectionId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteTrackSelection(selectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.trackSelection.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
