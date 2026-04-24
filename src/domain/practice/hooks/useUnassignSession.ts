'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { unassignSession } from '../api/unassignSession';
import type { PracticeDetailResponse } from '../types';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PracticeDetailResponse | null };

export function useUnassignSession(practiceId: string, options?: Options) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.practice.detail(practiceId)];

  return useMutation<void, Error, string, Context>({
    mutationFn: (sessionId) => unassignSession(practiceId, sessionId),
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeDetailResponse | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<PracticeDetailResponse>(queryKey, {
          ...previous,
          sessions: previous.sessions.map((s) =>
            s.sessionId === sessionId ? { ...s, participant: null } : s,
          ),
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
