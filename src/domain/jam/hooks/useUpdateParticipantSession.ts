'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateParticipantSession } from '../api/updateParticipantSession';
import type { JamParticipantResponse, UpdateParticipantSessionRequest } from '../types';

type Vars = { participantId: string; req: UpdateParticipantSessionRequest };

type Options = {
  onSuccess?: (data: JamParticipantResponse) => void;
  onError?: (error: Error) => void;
};

export function useUpdateParticipantSession(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<JamParticipantResponse, Error, Vars>({
    mutationFn: ({ participantId, req }) => updateParticipantSession(jamId, participantId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
