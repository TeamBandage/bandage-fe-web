'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deletePractice } from '../api/deletePractice';

type UseDeletePracticeOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeletePractice(practiceId: string, options?: UseDeletePracticeOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deletePractice(practiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.practice.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
