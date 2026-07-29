'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMySetlists } from '../api';
import type { SetlistResponse } from '../types/res';

export function useMySetlists(pageSize: number = 20) {
  return useInfiniteCursor<SetlistResponse, string>(
    [...queryKeys.setlist.my(), pageSize],
    ({ lastId, pageSize: size }) => getMySetlists({ lastId, pageSize: size }),
    pageSize,
  );
}
