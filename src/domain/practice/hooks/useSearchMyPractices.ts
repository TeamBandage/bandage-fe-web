'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { searchMyPractices } from '../api/searchMyPractices';
import type { PracticeListItemResponse } from '../types';

/** API_SPEC §4-1-3 — 본인 참여 합주 keyword 검색. */
export function useSearchMyPractices(keyword: string, pageSize: number = 20) {
  const trimmed = keyword.trim();
  return useInfiniteCursor<PracticeListItemResponse, string>(
    [...queryKeys.practice.mySearch(trimmed), pageSize],
    ({ lastId, pageSize: size }) => searchMyPractices({ keyword: trimmed, lastId, pageSize: size }),
    pageSize,
    { enabled: trimmed.length > 0 },
  );
}
