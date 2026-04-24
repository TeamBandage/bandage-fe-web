'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { leaveBand } from '../api/leaveBand';

type UseLeaveBandOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useLeaveBand(bandId: string, options?: UseLeaveBandOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => leaveBand(bandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
