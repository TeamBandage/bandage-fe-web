'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { markAllAsRead } from '../api/markAllAsRead';

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount() });
    },
  });
}
