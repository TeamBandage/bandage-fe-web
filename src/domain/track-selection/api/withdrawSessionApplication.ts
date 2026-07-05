import { apiClient } from '@/global/api/apiClient';

export async function withdrawSessionApplication(
  selectionId: string,
  itemId: string,
  sessionId: string,
  userId: number,
): Promise<void> {
  await apiClient.delete<null>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/sessions/${sessionId}/applicants/${userId}`,
  );
}
