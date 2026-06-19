'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteJam } from '../api/deleteJam';

type UseDeletePracticeOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteJam(practiceId: string, options?: UseDeletePracticeOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteJam(practiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
