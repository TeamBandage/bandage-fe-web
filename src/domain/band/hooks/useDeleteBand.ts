'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteBand } from '../api/deleteBand';

type UseDeleteBandOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteBand(bandId: string, options?: UseDeleteBandOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteBand(bandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.my()] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.list()] });
      queryClient.removeQueries({ queryKey: [...queryKeys.band.detail(bandId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
