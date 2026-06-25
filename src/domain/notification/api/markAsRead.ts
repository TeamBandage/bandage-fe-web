import { apiClient } from '@/global/api/apiClient';

export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
}
