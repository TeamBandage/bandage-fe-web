'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { transferSetlistManager } from '../api';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/** 셋리스트 매니저 권한 양도. mutate에 새 매니저가 될 memberId를 넘긴다. */
export function useTransferSetlistManager(setlistId: string, options?: Options) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: (managerId) => transferSetlistManager(setlistId, managerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.detail(setlistId) });
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.participants(setlistId) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
