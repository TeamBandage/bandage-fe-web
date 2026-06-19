import { apiClient } from '@/global/api/apiClient';

export async function deleteBandProfileImage(bandId: string): Promise<void> {
  await apiClient.delete(`/api/v1/bands/${bandId}/profile-image`);
}
