'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyJams } from '../api/getMyJams';
import type { JamListItemResponse } from '../types';

/**
 * API_SPEC §4-1-1 — 본인 참여 합주 목록 (커서 페이징).
 * range 전달 시 해당 기간(yyyy-MM-dd, inclusive)으로 필터링 — 주간 조회 등에 사용.
 */
export function useMyJams(pageSize: number = 20, range?: { from: string; to: string }) {
  return useInfiniteCursor<JamListItemResponse, string>(
    [...queryKeys.jam.my(), pageSize, range?.from ?? null, range?.to ?? null],
    ({ lastId, pageSize: size }) =>
      getMyJams({ lastId, pageSize: size, from: range?.from, to: range?.to }),
    pageSize,
  );
}
