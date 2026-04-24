'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getBands } from '../api/getBands';
import type { BandInfoResponse } from '../types';

export function useBandList(pageSize: number = 20) {
  return useInfiniteCursor<BandInfoResponse, string>(
    [...queryKeys.band.list(), pageSize],
    ({ lastId, pageSize: size }) => getBands({ lastId, pageSize: size }),
    pageSize,
  );
}
