'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import type { NotificationResponse, UnreadNotificationCountResponse } from '../types/res';
import { markAsRead } from '../api/markAsRead';

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: markAsRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.unreadCount() });

      const prevList = queryClient.getQueryData<NotificationResponse[]>(
        queryKeys.notification.list(),
      );
      const prevCount = queryClient.getQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
      );

      queryClient.setQueryData<NotificationResponse[]>(queryKeys.notification.list(), (prev) =>
        prev?.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      queryClient.setQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
        (prev) => (prev ? { count: Math.max(0, prev.count - 1) } : prev),
      );

      return { prevList, prevCount };
    },
    onError: (_err, _id, context) => {
      const ctx = context as
        | { prevList?: NotificationResponse[]; prevCount?: UnreadNotificationCountResponse }
        | undefined;
      if (ctx?.prevList !== undefined)
        queryClient.setQueryData(queryKeys.notification.list(), ctx.prevList);
      if (ctx?.prevCount !== undefined)
        queryClient.setQueryData(queryKeys.notification.unreadCount(), ctx.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount() });
    },
  });
}
