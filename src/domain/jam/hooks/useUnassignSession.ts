'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteParticipant } from '../api/unassignSession';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** participantId(UUID) 로 참여자를 제거합니다. */
export function useDeleteParticipant(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (participantId) => deleteParticipant(jamId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.jam.detail(jamId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

export { useDeleteParticipant as useUnassignSession };
