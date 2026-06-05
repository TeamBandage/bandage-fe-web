'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyAvailability } from '../api/getMyAvailability';
import type { MemberAvailabilityResponse } from '../types';

export function useMyAvailability() {
  const authenticated = useIsAuthenticated();
  return useQuery<MemberAvailabilityResponse, Error>({
    queryKey: [...queryKeys.member.myAvailability],
    queryFn: getMyAvailability,
    enabled: authenticated,
    staleTime: 5 * 60 * 1000,
  });
}
