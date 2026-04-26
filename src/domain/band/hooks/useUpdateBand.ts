'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateBand, type UpdateBandRequest } from '../api/updateBand';

type UseUpdateBandOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useUpdateBand(bandId: string, options?: UseUpdateBandOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, UpdateBandRequest>({
    mutationFn: (req) => updateBand(bandId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.detail(bandId)] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.my()] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.list()] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
