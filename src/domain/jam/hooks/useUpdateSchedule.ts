'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSchedule } from '../api/updateSchedule';
import type { JamDetailResponse, UpdateTimeInfoRequest } from '../types';

type UseUpdateScheduleOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: JamDetailResponse | null };

export function useUpdateSchedule(jamId: string, options?: UseUpdateScheduleOptions) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.jam.detail(jamId)];

  return useMutation<void, Error, UpdateTimeInfoRequest, Context>({
    mutationFn: (req) => updateSchedule(jamId, req),
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<JamDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<JamDetailResponse>(queryKey, {
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
