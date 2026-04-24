'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateVenue } from '../api/updateVenue';
import type { PracticeDetailResponse, UpdateVenueRequest } from '../types';

type UseUpdateVenueOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PracticeDetailResponse | null };

export function useUpdateVenue(practiceId: string, options?: UseUpdateVenueOptions) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.practice.detail(practiceId)];

  return useMutation<void, Error, UpdateVenueRequest, Context>({
    mutationFn: (req) => updateVenue(practiceId, req),
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<PracticeDetailResponse>(queryKey, {
          ...previous,
          venue: req.venue,
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
