'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { transferManager } from '../api/transferManager';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** 선곡 회의 매니저 권한 양도. mutate에 새 매니저가 될 memberId를 넘긴다. */
export function useTransferManager(selectionId: string, options?: Options) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: (managerId) => transferManager(selectionId, managerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.detail(selectionId) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
