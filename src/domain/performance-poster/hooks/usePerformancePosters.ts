import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformancePosters } from '../api';

export function usePerformancePosters(performanceId: string) {
  return useQuery({
    queryKey: queryKeys.performancePoster.list(performanceId),
    queryFn: () => getPerformancePosters(performanceId),
    enabled: !!performanceId,
  });
}
