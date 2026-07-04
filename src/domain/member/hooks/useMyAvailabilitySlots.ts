'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyAvailabilitySlots } from '../api/getMyAvailabilitySlots';
import type { ScheduleSlotResponse } from '../types';

export function useMyAvailabilitySlots(from: string, to: string) {
  const authenticated = useIsAuthenticated();
  return useQuery<ScheduleSlotResponse[], Error>({
    queryKey: queryKeys.member.myAvailabilitySlots(from, to),
    queryFn: () => getMyAvailabilitySlots(from, to),
    enabled: authenticated && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}
