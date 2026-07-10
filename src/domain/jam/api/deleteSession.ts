import { apiClient } from '@/global/api/apiClient';

export async function deleteSession(jamId: string, sessionId: string): Promise<void> {
  await apiClient.delete<void>(`/api/v1/jams/${jamId}/sessions/${sessionId}`);
}
