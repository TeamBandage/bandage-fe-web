import { apiClient } from '@/global/api/apiClient';

export function removePerformanceSetlist(performanceId: string, setlistId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/performances/${performanceId}/setlists/${setlistId}`);
}
