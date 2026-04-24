'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createSession } from '../api/createSession';
import type { CreateSessionRequest, CreateSessionResponse } from '../types';

type Options = {
  onSuccess?: (data: CreateSessionResponse) => void;
  onError?: (error: Error) => void;
};

export function useCreateSession(practiceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<CreateSessionResponse, Error, CreateSessionRequest>({
    mutationFn: (req) => createSession(practiceId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.practice.detail(practiceId)] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
