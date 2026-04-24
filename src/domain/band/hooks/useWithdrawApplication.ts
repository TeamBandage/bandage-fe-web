'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { withdrawApplication } from '../api/withdrawApplication';

type UseWithdrawApplicationOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useWithdrawApplication(bandId: string, options?: UseWithdrawApplicationOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => withdrawApplication(bandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.detail(bandId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
