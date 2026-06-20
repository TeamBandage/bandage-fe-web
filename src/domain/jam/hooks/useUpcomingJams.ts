'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMyJams } from '../api/getMyJams';
import type { JamListItemResponse } from '../types';

/** 본인 참여 합주 중 임박한 N건. API_SPEC §4-1-1 /practices/me 의 첫 페이지를 사용. */
export function useUpcomingJams(limit: number = 3) {
  return useQuery<JamListItemResponse[], Error>({
    queryKey: [...queryKeys.jam.upcoming(limit)],
    queryFn: async () => {
      const page = await getMyJams({ pageSize: limit });
      return page.content;
    },
  });
}
