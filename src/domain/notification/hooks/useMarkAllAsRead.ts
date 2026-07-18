'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import type { NotificationResponse, UnreadNotificationCountResponse } from '../types/res';
import { markAllAsRead } from '../api/markAllAsRead';

type ListEntry = [readonly unknown[], NotificationResponse[] | undefined];

const listQueryKey = [...queryKeys.notification.all, 'list'];

/** 캐시 키의 unreadOnly 위치(list 캐시 키의 3번째 요소)로 목록 종류를 판별. */
function isUnreadOnlyKey(key: readonly unknown[]): boolean {
  return key[2] === true;
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.unreadCount() });

      const prevLists: ListEntry[] = queryClient.getQueriesData<NotificationResponse[]>({
        queryKey: listQueryKey,
      });
      const prevCount = queryClient.getQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
      );

      // unreadOnly 캐시는 전체 읽음 처리 시 비우고, 전체 캐시는 read 플래그만 전부 갱신.
      prevLists.forEach(([key, data]) => {
        if (!data) return;
        const next = isUnreadOnlyKey(key) ? [] : data.map((n) => ({ ...n, read: true }));
        queryClient.setQueryData(key, next);
      });
      queryClient.setQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
        { count: 0 },
      );

      return { prevLists, prevCount };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as
        | { prevLists?: ListEntry[]; prevCount?: UnreadNotificationCountResponse }
        | undefined;
      ctx?.prevLists?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (ctx?.prevCount !== undefined)
        queryClient.setQueryData(queryKeys.notification.unreadCount(), ctx.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount() });
    },
  });
}
