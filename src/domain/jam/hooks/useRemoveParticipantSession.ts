'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { removeParticipantSession } from '../api/removeParticipantSession';

type Vars = { participantId: string; sessionId: string };

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useRemoveParticipantSession(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Vars>({
    mutationFn: ({ participantId, sessionId }) =>
      removeParticipantSession(jamId, participantId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
