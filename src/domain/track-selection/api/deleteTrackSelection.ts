import { apiClient } from '@/global/api/apiClient';

export async function deleteTrackSelection(selectionId: string): Promise<void> {
  await apiClient.delete<void>(`/api/v1/track-selections/${selectionId}`);
}
