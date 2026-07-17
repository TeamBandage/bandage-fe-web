'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteParticipant } from '../api/deleteParticipant';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** 참여자를 합주에서 완전히 제거합니다(보유한 세션 배정도 함께 삭제됨). */
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
