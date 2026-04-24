import { apiClient } from '@/global/api/apiClient';

export async function leaveBand(bandId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/bands/${bandId}/members/me`);
}
