import { apiClient } from '@/global/api/apiClient';

export async function upsertRefLink(songId: string, refLink: string): Promise<void> {
  await apiClient.put<null>(`/api/v1/practice-songs/${songId}/ref-link`, { refLink });
}
