import { apiClient } from '@/global/api/apiClient';

export async function applyForSession(
  selectionId: string,
  itemId: string,
  sessionId: string,
): Promise<void> {
  await apiClient.post<null>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/sessions/${sessionId}/applicants`,
  );
}
