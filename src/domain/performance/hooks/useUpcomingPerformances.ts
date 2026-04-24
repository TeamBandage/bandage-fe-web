'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformances } from '../api/getPerformances';
import type { PerformanceListItemResponse } from '../types';

export function useUpcomingPerformances(limit: number = 2) {
  return useQuery<PerformanceListItemResponse[], Error>({
    queryKey: [...queryKeys.performance.upcoming(limit)],
    queryFn: async () => {
      const page = await getPerformances({ pageSize: limit });
      return page.content;
    },
  });
}
