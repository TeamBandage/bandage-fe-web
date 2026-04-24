'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getPerformances } from '../api/getPerformances';
import type { PerformanceListItemResponse } from '../types';

export function usePerformanceList(bandId?: string, pageSize: number = 20) {
  return useInfiniteCursor<PerformanceListItemResponse, string>(
    [...queryKeys.performance.list(bandId), pageSize],
    ({ lastId, pageSize: size }) => getPerformances({ bandId, lastId, pageSize: size }),
    pageSize,
  );
}
