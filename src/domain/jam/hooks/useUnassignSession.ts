'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteParticipant } from '../api/unassignSession';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** participantId(UUID) 로 세션 배정만 해제합니다. 참여자 자체는 목록에 남고 미배정 상태가 됩니다. */
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
