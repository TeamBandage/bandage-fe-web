'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyNotifications } from '../api/getMyNotifications';
import type { NotificationResponse } from '../types/res';

const PAGE_SIZE = 50;

export function useMyNotifications() {
  const authenticated = useIsAuthenticated();
  return useQuery<NotificationResponse[], Error>({
    queryKey: queryKeys.notification.list(),
    queryFn: async () => {
      const page = await getMyNotifications({ pageSize: PAGE_SIZE });
      return page.content.filter((n) => !n.read);
    },
    enabled: authenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
