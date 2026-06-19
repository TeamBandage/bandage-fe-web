'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { addParticipant } from '../api/addParticipant';
import type { AddParticipantRequest, JamParticipantResponse } from '../types';

type Options = {
  onSuccess?: (data: JamParticipantResponse) => void;
  onError?: (error: Error) => void;
};

export function useAddParticipant(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<JamParticipantResponse, Error, AddParticipantRequest>({
    mutationFn: (req) => addParticipant(jamId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
