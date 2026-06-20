'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getJams } from '../api/getJams';
import type { JamListItemResponse } from '../types';

export function useJams(bandId?: string, pageSize: number = 20) {
  return useInfiniteCursor<JamListItemResponse, string>(
    [...queryKeys.jam.list(bandId), pageSize],
    ({ lastId, pageSize: size }) => getJams({ bandId, lastId, pageSize: size }),
    pageSize,
  );
}
