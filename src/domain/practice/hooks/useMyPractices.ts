'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyPractices } from '../api/getMyPractices';
import type { PracticeListItemResponse } from '../types';

/** API_SPEC §4-1-1 — 본인 참여 합주 목록 (커서 페이징). */
export function useMyPractices(pageSize: number = 20) {
  return useInfiniteCursor<PracticeListItemResponse, string>(
    [...queryKeys.practice.my(), pageSize],
    ({ lastId, pageSize: size }) => getMyPractices({ lastId, pageSize: size }),
    pageSize,
  );
}
