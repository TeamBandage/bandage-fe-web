'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPractice } from '../api/getPractice';
import type { PracticeDetailResponse } from '../types';

export function usePractice(practiceId: string, options?: { enabled?: boolean }) {
  return useQuery<PracticeDetailResponse | null, Error>({
    queryKey: [...queryKeys.practice.detail(practiceId)],
    queryFn: () => getPractice(practiceId),
    enabled: (options?.enabled ?? true) && !!practiceId,
  });
}
