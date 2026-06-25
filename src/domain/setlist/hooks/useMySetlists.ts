'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMySetlists } from '../api';

export function useMySetlists() {
  return useQuery({
    queryKey: queryKeys.setlist.my(),
    queryFn: () => getMySetlists({ pageSize: 50 }),
  });
}
