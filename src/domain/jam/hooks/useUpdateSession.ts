'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSession } from '../api/updateSession';
import type { UpdateSessionRequest } from '../types/req';
import type { JamSessionResponse } from '../types/res';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useUpdateSession(jamId: string, sessionId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<JamSessionResponse, Error, UpdateSessionRequest>({
    mutationFn: (body) => updateSession(jamId, sessionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
