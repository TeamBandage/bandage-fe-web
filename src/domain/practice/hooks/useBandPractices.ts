'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getPractices } from '../api/getPractices';
import type { PracticeListItemResponse } from '../types';

/** API_SPEC §4-1-2 — 특정 밴드 멤버가 참여 중인 합주 목록. bandId 필수. */
export function useBandPractices(bandId: string, pageSize: number = 20) {
  return useInfiniteCursor<PracticeListItemResponse, string>(
    [...queryKeys.practice.list(bandId), pageSize],
    ({ lastId, pageSize: size }) => getPractices({ bandId, lastId, pageSize: size }),
    pageSize,
    { enabled: !!bandId },
  );
}
