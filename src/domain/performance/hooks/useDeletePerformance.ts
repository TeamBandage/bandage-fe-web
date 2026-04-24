'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deletePerformance } from '../api/deletePerformance';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeletePerformance(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deletePerformance(performanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
