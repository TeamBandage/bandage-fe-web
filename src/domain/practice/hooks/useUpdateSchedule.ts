'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSchedule } from '../api/updateSchedule';
import type { PracticeDetailResponse, UpdateScheduleRequest } from '../types';

type UseUpdateScheduleOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PracticeDetailResponse | null };

export function useUpdateSchedule(practiceId: string, options?: UseUpdateScheduleOptions) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.practice.detail(practiceId)];

  return useMutation<void, Error, UpdateScheduleRequest, Context>({
    mutationFn: (req) => updateSchedule(practiceId, req),
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<PracticeDetailResponse>(queryKey, {
          ...previous,
          startAt: req.startAt,
          durationMinutes: req.durationMinutes,
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
