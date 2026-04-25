'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMyPractices } from '../api/getMyPractices';
import type { PracticeListItemResponse } from '../types';

/** 본인 참여 합주 중 임박한 N건. API_SPEC §4-1-1 /practices/me 의 첫 페이지를 사용. */
export function useUpcomingPractices(limit: number = 3) {
  return useQuery<PracticeListItemResponse[], Error>({
    queryKey: [...queryKeys.practice.upcoming(limit)],
    queryFn: async () => {
      const page = await getMyPractices({ pageSize: limit });
      return page.content;
    },
  });
}
