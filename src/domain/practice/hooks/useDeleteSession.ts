'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteSession } from '../api/deleteSession';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteSession(practiceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => deleteSession(practiceId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.practice.detail(practiceId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
