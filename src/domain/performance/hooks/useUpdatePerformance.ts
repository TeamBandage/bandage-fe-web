'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updatePerformance } from '../api/updatePerformance';
import type { PerformanceDetailResponse, UpdatePerformanceRequest } from '../types';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PerformanceDetailResponse | null };

export function useUpdatePerformance(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.performance.detail(performanceId)];

  return useMutation<void, Error, UpdatePerformanceRequest, Context>({
    mutationFn: (req) => updatePerformance(performanceId, req),
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PerformanceDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<PerformanceDetailResponse>(queryKey, {
          ...previous,
          ...(req.title !== undefined ? { title: req.title } : {}),
          ...(req.startAt !== undefined ? { startAt: req.startAt } : {}),
          ...(req.durationMinutes !== undefined ? { durationMinutes: req.durationMinutes } : {}),
          ...(req.venue !== undefined ? { venue: req.venue } : {}),
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
