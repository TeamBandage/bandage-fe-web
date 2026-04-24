'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createBand } from '../api/createBand';
import type { CreateBandRequest, CreateBandResponse } from '../types';

type UseCreateBandOptions = {
  onSuccess?: (data: CreateBandResponse) => void;
  onError?: (error: Error) => void;
};

export function useCreateBand(options?: UseCreateBandOptions) {
  const queryClient = useQueryClient();
  return useMutation<CreateBandResponse, Error, CreateBandRequest>({
    mutationFn: createBand,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.all] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
