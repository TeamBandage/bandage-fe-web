'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { addParticipant } from '../api/addParticipant';
import type { AddParticipantRequest, AddParticipantResponse } from '../types';

type Options = {
  onSuccess?: (data: AddParticipantResponse) => void;
  onError?: (error: Error) => void;
};

export function useAddParticipant(practiceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<AddParticipantResponse, Error, AddParticipantRequest>({
    mutationFn: (req) => addParticipant(practiceId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.practice.detail(practiceId)] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
