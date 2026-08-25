import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyPerformancePosters } from '../api';
import type { PerformancePosterResponse } from '../types/res';

export function useMyPerformancePosters(pageSize: number = 20) {
  return useInfiniteCursor<PerformancePosterResponse, string>(
    queryKeys.performancePoster.my(),
    ({ lastId, pageSize: size }) => getMyPerformancePosters({ lastId, pageSize: size }),
    pageSize,
  );
}
