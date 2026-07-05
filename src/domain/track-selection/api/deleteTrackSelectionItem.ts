import { apiClient } from '@/global/api/apiClient';

export async function deleteTrackSelectionItem(selectionId: string, itemId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/track-selections/${selectionId}/items/${itemId}`);
}
