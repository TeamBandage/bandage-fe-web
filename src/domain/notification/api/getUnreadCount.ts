import { apiClient } from '@/global/api/apiClient';

import type { UnreadNotificationCountResponse } from '../types/res';

export async function getUnreadCount(): Promise<UnreadNotificationCountResponse> {
  const data = await apiClient.get<UnreadNotificationCountResponse | null>(
    '/api/v1/notifications/unread-count',
  );
  return data ?? { count: 0 };
}
