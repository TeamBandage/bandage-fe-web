import { apiClient } from '@/global/api/apiClient';

export async function deleteMyProfileImage(): Promise<void> {
  return apiClient.delete('/api/v1/members/me/profile-image');
}
