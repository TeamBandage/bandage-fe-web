'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMyBands } from '../api/getMyBands';
import type { MyBandInfoResponse } from '../types';

/** API_SPEC §3-3-1 — 현재 로그인 회원 소속 밴드 (myRole 포함). */
export function useMyBands(limit: number = 10) {
  return useQuery<MyBandInfoResponse[], Error>({
    queryKey: [...queryKeys.band.my(), limit],
    queryFn: async () => {
      const page = await getMyBands({ pageSize: limit });
      return page.content;
    },
  });
}
