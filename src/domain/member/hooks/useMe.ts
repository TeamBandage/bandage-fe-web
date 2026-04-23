'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMe } from '../api/getMe';
import type { MemberInfoResponse } from '../types';

type UseMeOptions = {
  enabled?: boolean;
  staleTime?: number;
};

export function useMe(options?: UseMeOptions) {
  const authenticated = useIsAuthenticated();
  return useQuery<MemberInfoResponse | null, Error>({
    queryKey: [...queryKeys.member.me],
    queryFn: getMe,
    enabled: (options?.enabled ?? true) && authenticated,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  });
}
