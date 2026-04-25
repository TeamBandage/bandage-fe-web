'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMyPerformances } from '../api/getMyPerformances';
import type { PerformanceListItemResponse } from '../types';

/** 본인 소속 밴드가 참여하는 공연 중 임박한 N건. API_SPEC §6-2-1 /performances/me 의 첫 페이지를 사용. */
export function useUpcomingPerformances(limit: number = 2) {
  return useQuery<PerformanceListItemResponse[], Error>({
    queryKey: [...queryKeys.performance.upcoming(limit)],
    queryFn: async () => {
      const page = await getMyPerformances({ pageSize: limit });
      return page.content;
    },
  });
}
