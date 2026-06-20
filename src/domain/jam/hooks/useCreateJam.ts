'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createJam } from '../api/createJam';
import type { CreateJamRequest, JamResponse } from '../types';

type UseCreatePracticeOptions = {
  onSuccess?: (data: JamResponse) => void;
  onError?: (error: Error) => void;
};

export function useCreateJam(options?: UseCreatePracticeOptions) {
  const queryClient = useQueryClient();
  return useMutation<JamResponse, Error, CreateJamRequest>({
    mutationFn: createJam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.all] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
