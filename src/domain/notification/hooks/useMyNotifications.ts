'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyNotifications } from '../api/getMyNotifications';
import type { NotificationResponse } from '../types/res';

export function useMyNotifications() {
  const authenticated = useIsAuthenticated();
  return useQuery<NotificationResponse[], Error>({
    queryKey: queryKeys.notification.list(),
    queryFn: getMyNotifications,
    enabled: authenticated,
    staleTime: 30 * 1000,
  });
}
