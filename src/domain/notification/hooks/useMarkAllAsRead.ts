'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import type { NotificationResponse, UnreadNotificationCountResponse } from '../types/res';
import { markAllAsRead } from '../api/markAllAsRead';

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.unreadCount() });

      const prevList = queryClient.getQueryData<NotificationResponse[]>(
        queryKeys.notification.list(),
      );
      const prevCount = queryClient.getQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
      );

      queryClient.setQueryData<NotificationResponse[]>(queryKeys.notification.list(), (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
      queryClient.setQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
        { count: 0 },
      );

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
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
