'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createPractice } from '../api/createPractice';
import type { CreatePracticeRequest, CreatePracticeResponse } from '../types';

type UseCreatePracticeOptions = {
  onSuccess?: (data: CreatePracticeResponse) => void;
  onError?: (error: Error) => void;
};

export function useCreatePractice(options?: UseCreatePracticeOptions) {
  const queryClient = useQueryClient();
  return useMutation<CreatePracticeResponse, Error, CreatePracticeRequest>({
    mutationFn: createPractice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.practice.all] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
