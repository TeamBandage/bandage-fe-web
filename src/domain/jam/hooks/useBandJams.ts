'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getJams } from '../api/getJams';
import type { JamListItemResponse } from '../types';

/** API_SPEC §4-1-2 — 특정 밴드 멤버가 참여 중인 합주 목록. bandId 필수. */
export function useBandJams(bandId: string, pageSize: number = 20) {
  return useInfiniteCursor<JamListItemResponse, string>(
    [...queryKeys.jam.list(bandId), pageSize],
    ({ lastId, pageSize: size }) => getJams({ bandId, lastId, pageSize: size }),
    pageSize,
    { enabled: !!bandId },
  );
}
