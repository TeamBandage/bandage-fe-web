import { apiClient } from '@/global/api/apiClient';

export async function deleteSession(practiceId: string, sessionId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/practices/${practiceId}/sessions/${sessionId}`);
}
