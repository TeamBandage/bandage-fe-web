import { apiClient } from '@/global/api/apiClient';

export async function lockSelection(selectionId: string): Promise<void> {
  await apiClient.post<null>(`/api/v1/track-selections/${selectionId}/lock`);
}

export async function unlockSelection(selectionId: string): Promise<void> {
  await apiClient.post<null>(`/api/v1/track-selections/${selectionId}/unlock`);
}
