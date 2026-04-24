import { apiClient } from '@/global/api/apiClient';

export async function deletePractice(practiceId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/practices/${practiceId}`);
}
