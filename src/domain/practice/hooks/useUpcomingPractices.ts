'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPractices } from '../api/getPractices';
import type { PracticeListItemResponse } from '../types';

export function useUpcomingPractices(limit: number = 3) {
  return useQuery<PracticeListItemResponse[], Error>({
    queryKey: [...queryKeys.practice.upcoming(limit)],
    queryFn: async () => {
      const page = await getPractices({ pageSize: limit });
      return page.content;
    },
  });
}
