'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { decidePerformanceInvitation } from '../api/decidePerformanceInvitation';
import type { PerformanceInvitationStatus } from '../types/res';

type DecideVars = {
  invitationId: string;
  status: Extract<PerformanceInvitationStatus, 'ACCEPTED' | 'REJECTED'>;
};

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDecidePerformanceInvitation(performanceId: string, options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DecideVars>({
    mutationFn: ({ invitationId, status }) =>
      decidePerformanceInvitation(performanceId, invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performanceInvitation.my()] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.performance.detail(performanceId)] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
