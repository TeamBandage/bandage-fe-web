'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformanceDetail } from '../api/getPerformanceDetail';
import type { PerformanceDetailResponse } from '../types';

export function usePerformanceDetail(performanceId: string, options?: { enabled?: boolean }) {
  return useQuery<PerformanceDetailResponse | null, Error>({
    queryKey: [...queryKeys.performance.detail(performanceId)],
    queryFn: () => getPerformanceDetail(performanceId),
    enabled: (options?.enabled ?? true) && !!performanceId,
  });
}
