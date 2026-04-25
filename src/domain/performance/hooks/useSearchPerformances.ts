'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { searchPerformances } from '../api/searchPerformances';
import type { PerformanceListItemResponse } from '../types';

/** API_SPEC §6-2-2 — 공연 제목 keyword 검색. */
export function useSearchPerformances(keyword: string, pageSize: number = 20) {
  const trimmed = keyword.trim();
  return useInfiniteCursor<PerformanceListItemResponse, string>(
    [...queryKeys.performance.search(trimmed), pageSize],
    ({ lastId, pageSize: size }) =>
      searchPerformances({ keyword: trimmed, lastId, pageSize: size }),
    pageSize,
    { enabled: trimmed.length > 0 },
  );
}
