'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getJam } from '../api/getJam';
import type { JamDetailResponse } from '../types';

export function useJam(practiceId: string, options?: { enabled?: boolean }) {
  return useQuery<JamDetailResponse | null, Error>({
    queryKey: [...queryKeys.jam.detail(practiceId)],
    queryFn: () => getJam(practiceId),
    enabled: (options?.enabled ?? true) && !!practiceId,
  });
}
