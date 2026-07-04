'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyPerformanceInvitations } from '../api/getMyPerformanceInvitations';
import type { PerformanceInvitationResponse } from '../types/res';

export function useMyPerformanceInvitations(options?: { enabled?: boolean }) {
  const authenticated = useIsAuthenticated();
  return useQuery<PerformanceInvitationResponse[], Error>({
    queryKey: [...queryKeys.performanceInvitation.my()],
    queryFn: () => getMyPerformanceInvitations(),
    enabled: (options?.enabled ?? true) && authenticated,
  });
}
