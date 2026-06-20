import { apiClient } from '@/global/api/apiClient';

export async function deleteJam(practiceId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/jams/${practiceId}`);
}
