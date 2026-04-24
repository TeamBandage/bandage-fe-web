import { apiClient } from '@/global/api/apiClient';

export async function deletePerformance(performanceId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/performances/${performanceId}`);
}
