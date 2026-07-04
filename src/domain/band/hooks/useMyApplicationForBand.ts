'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getMyApplicationForBand } from '../api/getMyApplicationForBand';
import type { BandApplicationInfoResponse } from '../types';

export function useMyApplicationForBand(bandId: string) {
  return useQuery<BandApplicationInfoResponse | null>({
    queryKey: queryKeys.band.myApplication(bandId),
    queryFn: () => getMyApplicationForBand(bandId),
    enabled: !!bandId,
  });
}
