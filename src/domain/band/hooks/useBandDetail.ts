'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getBandDetail } from '../api/getBandDetail';
import type { BandInfoResponse } from '../types';

type UseBandDetailOptions = {
  enabled?: boolean;
};

export function useBandDetail(bandId: string, options?: UseBandDetailOptions) {
  return useQuery<BandInfoResponse | null, Error>({
    queryKey: [...queryKeys.band.detail(bandId)],
    queryFn: () => getBandDetail(bandId),
    enabled: (options?.enabled ?? true) && !!bandId,
  });
}
