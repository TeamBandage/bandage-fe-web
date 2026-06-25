import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deletePerformancePoster } from '../api';

export function useDeletePerformancePoster(
  performanceId: string,
  options?: { onSuccess?: () => void; onError?: (err: Error) => void },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (posterId: string) => deletePerformancePoster(posterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performancePoster.list(performanceId) });
      options?.onSuccess?.();
    },
    onError: (err: Error) => options?.onError?.(err),
  });
}
