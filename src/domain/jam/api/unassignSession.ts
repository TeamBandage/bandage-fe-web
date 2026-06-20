import { apiClient } from '@/global/api/apiClient';

/** DELETE /api/v1/jams/{jamId}/participants/{participantId} */
export async function deleteParticipant(jamId: string, participantId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/jams/${jamId}/participants/${participantId}`);
}
