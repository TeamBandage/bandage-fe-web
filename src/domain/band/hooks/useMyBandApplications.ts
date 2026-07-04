'use client';

import { queryKeys } from '@/global/config/queryKeys';
import type { ApplicationStatus } from '@/global/types';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyBandApplications } from '../api/getMyBandApplications';
import type { MyBandApplicationResponse } from '../types/res';

export function useMyBandApplications(status?: ApplicationStatus, pageSize: number = 20) {
  return useInfiniteCursor<MyBandApplicationResponse, string>(
    [...queryKeys.band.myApplications(status), pageSize],
    ({ lastId, pageSize: size }) => getMyBandApplications({ status, lastId, pageSize: size }),
    pageSize,
  );
}
