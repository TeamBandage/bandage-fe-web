import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { NotificationResponse } from '../types/res';

type NotificationListRaw = NotificationResponse[] | CursorResponse<NotificationResponse, number>;

export async function getMyNotifications(): Promise<NotificationResponse[]> {
  const data = await apiClient.get<NotificationListRaw | null>('/api/v1/notifications');
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.content;
}
