'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyJams } from '../api/getMyJams';
import type { JamListItemResponse } from '../types';

/** API_SPEC §4-1-1 — 본인 참여 합주 목록 (커서 페이징). */
export function useMyJams(pageSize: number = 20) {
  return useInfiniteCursor<JamListItemResponse, string>(
    [...queryKeys.jam.my(), pageSize],
    ({ lastId, pageSize: size }) => getMyJams({ lastId, pageSize: size }),
    pageSize,
  );
}
