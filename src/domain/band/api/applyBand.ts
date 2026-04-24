import { apiClient } from '@/global/api/apiClient';

export async function applyBand(bandId: string): Promise<void> {
  await apiClient.post<null>(`/api/v1/bands/${bandId}/applications`);
}
