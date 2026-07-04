'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { removePerformanceSetlist } from '../api/removePerformanceSetlist';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useRemovePerformanceSetlist(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (setlistId) => removePerformanceSetlist(performanceId, setlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.detail(performanceId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
