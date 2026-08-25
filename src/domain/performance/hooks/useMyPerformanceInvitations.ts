'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyPerformanceInvitations } from '../api/getMyPerformanceInvitations';
import type { PerformanceInvitationResponse } from '../types/res';

export function useMyPerformanceInvitations(options?: { enabled?: boolean; pageSize?: number }) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<PerformanceInvitationResponse, string>(
    queryKeys.performanceInvitation.my(),
    ({ lastId, pageSize }) => getMyPerformanceInvitations({ pageSize, lastId }),
    options?.pageSize ?? 20,
    { enabled: (options?.enabled ?? true) && authenticated },
  );
}
