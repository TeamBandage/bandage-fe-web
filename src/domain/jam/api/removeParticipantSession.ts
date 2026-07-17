import { apiClient } from '@/global/api/apiClient';

export async function removeParticipantSession(
  jamId: string,
  participantId: string,
  sessionId: string,
): Promise<void> {
  await apiClient.delete<null>(
    `/api/v1/jams/${jamId}/participants/${participantId}/sessions/${sessionId}`,
  );
}
