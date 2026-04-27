'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyMetrics } from '../api/getMyMetrics';
import type { MemberMetricsResponse } from '../types';

/** API_SPEC §2-5 — 본인 메트릭 (홈 화면 통계 카드 backing). */
export function useMyMetrics(options?: { enabled?: boolean; staleTime?: number }) {
  const authenticated = useIsAuthenticated();
  return useQuery<MemberMetricsResponse, Error>({
    queryKey: [...queryKeys.member.myMetrics],
    queryFn: getMyMetrics,
    enabled: (options?.enabled ?? true) && authenticated,
    staleTime: options?.staleTime ?? 60 * 1000,
  });
}
