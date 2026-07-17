'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { addParticipantSession } from '../api/addParticipantSession';

type Vars = { participantId: string; sessionId: string };

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useAddParticipantSession(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Vars>({
    mutationFn: ({ participantId, sessionId }) =>
      addParticipantSession(jamId, participantId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
