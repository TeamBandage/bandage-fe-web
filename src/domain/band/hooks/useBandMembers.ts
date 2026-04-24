'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getBandMembers } from '../api/getBandMembers';
import type { BandMemberInfoResponse } from '../types';

export function useBandMembers(bandId: string, pageSize: number = 20) {
  return useInfiniteCursor<BandMemberInfoResponse, string>(
    [...queryKeys.band.members(bandId), pageSize],
    ({ lastId, pageSize: size }) => getBandMembers(bandId, { lastId, pageSize: size }),
    pageSize,
    { enabled: !!bandId },
  );
}
