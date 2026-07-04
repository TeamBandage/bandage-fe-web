'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { sendPerformanceInvitation } from '../api/sendPerformanceInvitation';
import type { PerformanceInvitationCreateRequest } from '../types/req';
import type { PerformanceInvitationResponse } from '../types/res';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useSendPerformanceInvitation(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<PerformanceInvitationResponse, Error, PerformanceInvitationCreateRequest>({
    mutationFn: (req) => sendPerformanceInvitation(performanceId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.performanceInvitation.sent(performanceId)],
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
