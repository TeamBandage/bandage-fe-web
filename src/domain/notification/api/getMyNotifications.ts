import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { NotificationResponse } from '../types/res';

export async function getMyNotifications(params: {
  pageSize: number;
  lastId?: string;
  unreadOnly?: boolean;
}): Promise<CursorResponse<NotificationResponse, string>> {
  const data = await apiClient.get<CursorResponse<NotificationResponse, string> | null>(
    '/api/v1/notifications',
    {
      query: {
        pageSize: params.pageSize,
        lastId: params.lastId,
        unreadOnly: params.unreadOnly ? true : undefined,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
