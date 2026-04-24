import { apiClient } from '@/global/api/apiClient';

export async function removePerformancePractice(
  performanceId: string,
  practiceId: string,
): Promise<void> {
  await apiClient.delete<null>(`/api/v1/performances/${performanceId}/practices/${practiceId}`);
}
