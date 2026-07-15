'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { transferPerformanceOwner } from '../api/transferPerformanceOwner';
import type { TransferPerformanceOwnerRequest } from '../types/req';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useTransferPerformanceOwner(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, TransferPerformanceOwnerRequest>({
    mutationFn: (req) => transferPerformanceOwner(performanceId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.all] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
