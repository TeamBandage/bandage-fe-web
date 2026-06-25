import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updatePerformancePoster } from '../api';
import type { UpdatePerformancePosterRequest } from '../types/req';

export function useUpdatePerformancePoster(
  performanceId: string,
  posterId: string,
  options?: { onSuccess?: () => void; onError?: (err: Error) => void },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdatePerformancePosterRequest) => updatePerformancePoster(posterId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performancePoster.list(performanceId) });
      options?.onSuccess?.();
    },
    onError: (err: Error) => options?.onError?.(err),
  });
}
