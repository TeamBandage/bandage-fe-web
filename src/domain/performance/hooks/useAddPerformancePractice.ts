'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { addPerformancePractice } from '../api/addPerformancePractice';
import type { AddPerformancePracticeRequest, PerformancePracticeResponse } from '../types';

type Options = {
  onSuccess?: (data: PerformancePracticeResponse) => void;
  onError?: (error: Error) => void;
};

export function useAddPerformancePractice(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<PerformancePracticeResponse, Error, AddPerformancePracticeRequest>({
    mutationFn: (req) => addPerformancePractice(performanceId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.performance.detail(performanceId)],
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
