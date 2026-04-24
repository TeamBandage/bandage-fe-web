'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getPractices } from '../api/getPractices';
import type { PracticeListItemResponse } from '../types';

export function usePractices(bandId?: string, pageSize: number = 20) {
  return useInfiniteCursor<PracticeListItemResponse, string>(
    [...queryKeys.practice.list(bandId), pageSize],
    ({ lastId, pageSize: size }) => getPractices({ bandId, lastId, pageSize: size }),
    pageSize,
  );
}
