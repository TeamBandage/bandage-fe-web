'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createPerformance } from '../api/createPerformance';
import type { CreatePerformanceRequest, CreatePerformanceResponse } from '../types';

type Options = {
  onSuccess?: (data: CreatePerformanceResponse) => void;
  onError?: (error: Error) => void;
};

export function useCreatePerformance(options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<CreatePerformanceResponse, Error, CreatePerformanceRequest>({
    mutationFn: createPerformance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.all] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
