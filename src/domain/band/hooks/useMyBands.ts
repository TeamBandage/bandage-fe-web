'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getBands } from '../api/getBands';
import type { BandInfoResponse } from '../types';

// NOTE: API_SPEC v1 에 "내 밴드" 전용 엔드포인트가 없어, 일단 GET /api/v1/bands 첫 페이지를 사용한다.
// 백엔드에 /api/v1/members/me/bands 가 추가되면 이 훅의 fetcher 만 교체한다.
export function useMyBands(limit: number = 10) {
  return useQuery<BandInfoResponse[], Error>({
    queryKey: [...queryKeys.band.my(), limit],
    queryFn: async () => {
      const page = await getBands({ pageSize: limit });
      return page.content;
    },
  });
}
