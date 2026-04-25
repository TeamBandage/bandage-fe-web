'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { searchBands } from '../api/searchBands';
import type { BandInfoResponse } from '../types';

/** API_SPEC §3-3-2 — 밴드명 keyword 검색. 빈 keyword 는 enabled=false 로 보호. */
export function useBandSearch(keyword: string, pageSize: number = 20) {
  const trimmed = keyword.trim();
  return useInfiniteCursor<BandInfoResponse, string>(
    [...queryKeys.band.search(trimmed), pageSize],
    ({ lastId, pageSize: size }) => searchBands({ keyword: trimmed, lastId, pageSize: size }),
    pageSize,
    { enabled: trimmed.length > 0 },
  );
}
