'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { markAsRead } from '../api/markAsRead';

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.unreadCount() });
    },
  });
}
