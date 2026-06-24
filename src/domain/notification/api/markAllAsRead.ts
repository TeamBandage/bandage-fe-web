import { apiClient } from '@/global/api/apiClient';

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/api/v1/notifications/read-all');
}
