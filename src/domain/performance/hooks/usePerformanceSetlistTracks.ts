'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformanceSetlistTracks } from '../api/getPerformanceSetlistTracks';
import type { PerformanceSetlistTracksResponse } from '../types/res';

export function usePerformanceSetlistTracks(
  performanceId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<PerformanceSetlistTracksResponse[], Error>({
    queryKey: [...queryKeys.performance.setlistTracks(performanceId)],
    queryFn: () => getPerformanceSetlistTracks(performanceId),
    enabled: (options?.enabled ?? true) && !!performanceId,
  });
}
