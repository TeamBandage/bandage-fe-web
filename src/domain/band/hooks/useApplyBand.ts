'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { applyBand } from '../api/applyBand';

type UseApplyBandOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useApplyBand(bandId: string, options?: UseApplyBandOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => applyBand(bandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.detail(bandId)] });
      queryClient.invalidateQueries({ queryKey: queryKeys.band.myApplication(bandId) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
