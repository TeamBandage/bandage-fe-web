'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyBands } from '../api/getMyBands';
import type { MyBandInfoResponse } from '../types';

/** API_SPEC §3-3-1 — 현재 로그인 회원 소속 밴드 (myRole 포함). */
export function useMyBands(pageSize: number = 20) {
  return useInfiniteCursor<MyBandInfoResponse, string>(
    [...queryKeys.band.my(), pageSize],
    ({ lastId, pageSize: size }) => getMyBands({ lastId, pageSize: size }),
    pageSize,
  );
}
