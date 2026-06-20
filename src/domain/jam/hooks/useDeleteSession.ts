'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSessions } from '../api/createSession';
import type { JamDetailResponse, SessionDefDto } from '../types';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteSession(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (sessionId) => {
      const current = queryClient.getQueryData<JamDetailResponse>([...queryKeys.jam.detail(jamId)]);
      const remaining: SessionDefDto[] = (current?.sessions ?? [])
        .filter((s) => s.sessionId !== sessionId)
        .map((s) => ({
          sessionId: s.sessionId,
          label: s.label,
          short: s.short,
          need: s.need,
          custom: s.custom,
        }));
      await updateSessions(jamId, { sessions: remaining });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
