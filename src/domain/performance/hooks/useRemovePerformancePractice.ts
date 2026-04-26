'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { removePerformancePractice } from '../api/removePerformancePractice';
import type { PerformanceDetailResponse } from '../types';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PerformanceDetailResponse | null };

export function useRemovePerformancePractice(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.performance.detail(performanceId)];

  return useMutation<void, Error, string, Context>({
    mutationFn: (practiceId) => removePerformancePractice(performanceId, practiceId),
    onMutate: async (practiceId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PerformanceDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<PerformanceDetailResponse>(queryKey, {
          ...previous,
          practices: previous.practices.filter((p) => p.practiceId !== practiceId),
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      options?.onError?.(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => options?.onSuccess?.(),
  });
}
