'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { batchAddPerformanceSetlists } from '../api/batchAddPerformanceSetlists';
import type { PerformanceSetlistAddRequest } from '../types/req';
import type { PerformanceSetlistResponse } from '../types/res';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useBatchAddPerformanceSetlists(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<PerformanceSetlistResponse[], Error, PerformanceSetlistAddRequest>({
    mutationFn: (req) => batchAddPerformanceSetlists(performanceId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.detail(performanceId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
