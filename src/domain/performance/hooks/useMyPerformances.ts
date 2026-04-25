'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyPerformances } from '../api/getMyPerformances';
import type { PerformanceListItemResponse } from '../types';

/** API_SPEC §6-2-1 — 본인 소속 밴드가 참여하는 공연 목록. */
export function useMyPerformances(pageSize: number = 20) {
  return useInfiniteCursor<PerformanceListItemResponse, string>(
    [...queryKeys.performance.my(), pageSize],
    ({ lastId, pageSize: size }) => getMyPerformances({ lastId, pageSize: size }),
    pageSize,
  );
}
