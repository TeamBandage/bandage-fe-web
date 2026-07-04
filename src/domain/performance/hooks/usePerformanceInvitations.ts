'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformanceInvitations } from '../api/getPerformanceInvitations';
import type { PerformanceInvitationResponse } from '../types/res';

export function usePerformanceInvitations(performanceId: string, options?: { enabled?: boolean }) {
  return useQuery<PerformanceInvitationResponse[], Error>({
    queryKey: [...queryKeys.performanceInvitation.sent(performanceId)],
    queryFn: () => getPerformanceInvitations(performanceId),
    enabled: (options?.enabled ?? true) && !!performanceId,
  });
}
