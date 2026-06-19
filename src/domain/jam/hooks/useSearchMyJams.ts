'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { searchMyJams } from '../api/searchMyJams';
import type { JamListItemResponse } from '../types';

/** API_SPEC §4-1-3 — 본인 참여 합주 keyword 검색. */
export function useSearchMyJams(keyword: string, pageSize: number = 20) {
  const trimmed = keyword.trim();
  return useInfiniteCursor<JamListItemResponse, string>(
    [...queryKeys.jam.mySearch(trimmed), pageSize],
    ({ lastId, pageSize: size }) => searchMyJams({ keyword: trimmed, lastId, pageSize: size }),
    pageSize,
    { enabled: trimmed.length > 0 },
  );
}
