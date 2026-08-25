'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getPerformanceInvitations } from '../api/getPerformanceInvitations';
import type { PerformanceInvitationResponse } from '../types/res';

export function usePerformanceInvitations(
  performanceId: string,
  options?: { enabled?: boolean; pageSize?: number },
) {
  return useInfiniteCursor<PerformanceInvitationResponse, string>(
    queryKeys.performanceInvitation.sent(performanceId),
    ({ lastId, pageSize }) => getPerformanceInvitations(performanceId, { pageSize, lastId }),
    options?.pageSize ?? 20,
    { enabled: (options?.enabled ?? true) && !!performanceId },
  );
}
