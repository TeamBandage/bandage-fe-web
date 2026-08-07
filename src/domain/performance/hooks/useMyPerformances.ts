'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyPerformances } from '../api/getMyPerformances';
import type { PerformanceListItemResponse } from '../types';

/**
 * API_SPEC §6-2-1 — 본인 소속 밴드가 참여하는 공연 목록.
 * range 전달 시 해당 기간(yyyy-MM-dd, inclusive)으로 필터링 — 주간 조회 등에 사용.
 */
export function useMyPerformances(pageSize: number = 20, range?: { from: string; to: string }) {
  return useInfiniteCursor<PerformanceListItemResponse, string>(
    [...queryKeys.performance.my(), pageSize, range?.from ?? null, range?.to ?? null],
    ({ lastId, pageSize: size }) =>
      getMyPerformances({ lastId, pageSize: size, from: range?.from, to: range?.to }),
    pageSize,
  );
}
