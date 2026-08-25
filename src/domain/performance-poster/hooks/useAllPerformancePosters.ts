import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getPerformancePosters } from '../api';
import type { PerformancePosterResponse } from '../types/res';

export function useAllPerformancePosters(pageSize: number = 20) {
  return useInfiniteCursor<PerformancePosterResponse, string>(
    queryKeys.performancePoster.listAll(),
    ({ lastId, pageSize: size }) => getPerformancePosters({ lastId, pageSize: size }),
    pageSize,
  );
}
