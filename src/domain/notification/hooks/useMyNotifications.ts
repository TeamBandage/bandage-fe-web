'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getMyNotifications } from '../api/getMyNotifications';
import type { NotificationResponse } from '../types/res';

const PAGE_SIZE = 30;

export function useMyNotifications(unreadOnly?: boolean) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<NotificationResponse, string>(
    queryKeys.notification.list(unreadOnly),
    ({ lastId, pageSize }) => getMyNotifications({ pageSize, lastId, unreadOnly }),
    PAGE_SIZE,
    {
      enabled: authenticated,
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    },
  );
}
