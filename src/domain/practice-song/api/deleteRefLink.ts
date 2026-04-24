import { apiClient } from '@/global/api/apiClient';

export async function deleteRefLink(songId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/practice-songs/${songId}/ref-link`);
}
