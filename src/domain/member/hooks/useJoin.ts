'use client';

import { useMutation } from '@tanstack/react-query';

import { join } from '../api/join';
import type { JoinRequest, JoinResponse } from '../types';

type UseJoinOptions = {
  onSuccess?: (data: JoinResponse) => void;
  onError?: (error: Error) => void;
};

export function useJoin(options?: UseJoinOptions) {
  return useMutation<JoinResponse, Error, JoinRequest>({
    mutationFn: join,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
