import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { createPerformancePoster } from '../api';
import type { CreatePerformancePosterRequest } from '../types/req';

export function useCreatePerformancePoster(
  performanceId: string,
  options?: { onSuccess?: () => void; onError?: (err: Error) => void },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePerformancePosterRequest) => createPerformancePoster(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performancePoster.list(performanceId) });
      options?.onSuccess?.();
    },
    onError: (err: Error) => options?.onError?.(err),
  });
}
