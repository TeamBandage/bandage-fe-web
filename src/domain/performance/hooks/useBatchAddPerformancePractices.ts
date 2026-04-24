'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { batchAddPerformancePractices } from '../api/batchAddPerformancePractices';
import type { BatchAddPerformancePracticeRequest, PerformancePracticeResponse } from '../types';

type Options = {
  onSuccess?: (data: PerformancePracticeResponse[]) => void;
  onError?: (error: Error) => void;
};

export function useBatchAddPerformancePractices(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<PerformancePracticeResponse[], Error, BatchAddPerformancePracticeRequest>({
    mutationFn: (req) => batchAddPerformancePractices(performanceId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.performance.detail(performanceId)],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
