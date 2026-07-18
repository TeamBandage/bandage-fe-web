'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import type { CursorResponse } from '@/global/types';

import type { NotificationResponse, UnreadNotificationCountResponse } from '../types/res';
import { markAsRead } from '../api/markAsRead';

type ListData = { pages: CursorResponse<NotificationResponse, string>[]; pageParams: unknown[] };
type ListEntry = [readonly unknown[], ListData | undefined];

const listQueryKey = [...queryKeys.notification.all, 'list'];

/** 캐시 키의 unreadOnly 위치(list 캐시 키의 3번째 요소)로 목록 종류를 판별. */
function isUnreadOnlyKey(key: readonly unknown[]): boolean {
  return key[2] === true;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: markAsRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: queryKeys.notification.unreadCount() });

      const prevLists: ListEntry[] = queryClient.getQueriesData<ListData>({
        queryKey: listQueryKey,
      });
      const prevCount = queryClient.getQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
      );

      // unreadOnly 캐시는 읽음 처리된 항목을 페이지에서 제거, 전체 캐시는 read 플래그만 갱신.
      prevLists.forEach(([key, data]) => {
        if (!data) return;
        const unreadOnly = isUnreadOnlyKey(key);
        queryClient.setQueryData<ListData>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            content: unreadOnly
              ? page.content.filter((n) => n.id !== notificationId)
              : page.content.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
          })),
        });
      });
      queryClient.setQueryData<UnreadNotificationCountResponse>(
        queryKeys.notification.unreadCount(),
        (prev) => (prev ? { count: Math.max(0, prev.count - 1) } : prev),
      );

      return { prevLists, prevCount };
    },
    onError: (_err, _id, context) => {
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
