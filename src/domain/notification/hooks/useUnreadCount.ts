'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getUnreadCount } from '../api/getUnreadCount';

export function useUnreadCount() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.notification.unreadCount(),
    queryFn: getUnreadCount,
    enabled: authenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
