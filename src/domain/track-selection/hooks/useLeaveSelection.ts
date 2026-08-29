'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { leaveSelection } from '../api/leaveSelection';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** 현재 로그인한 회원이 선곡 회의에서 스스로 떠남. */
export function useLeaveSelection(selectionId: string, options?: Options) {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => leaveSelection(selectionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.detail(selectionId) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
