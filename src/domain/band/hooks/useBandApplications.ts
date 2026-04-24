'use client';

import { queryKeys } from '@/global/config/queryKeys';
import type { ApplicationStatus } from '@/global/types';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getBandApplications } from '../api/getBandApplications';
import type { BandApplicationInfoResponse } from '../types';

export function useBandApplications(
  bandId: string,
  status: ApplicationStatus = 'PENDING',
  pageSize: number = 20,
) {
  return useInfiniteCursor<BandApplicationInfoResponse, string>(
    [...queryKeys.band.applications(bandId, status), pageSize],
    ({ lastId, pageSize: size }) => getBandApplications(bandId, { lastId, pageSize: size, status }),
    pageSize,
    { enabled: !!bandId },
  );
}
