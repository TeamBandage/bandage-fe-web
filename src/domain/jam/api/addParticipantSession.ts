import { apiClient } from '@/global/api/apiClient';

export async function addParticipantSession(
  jamId: string,
  participantId: string,
  sessionId: string,
): Promise<void> {
  await apiClient.post<null>(
    `/api/v1/jams/${jamId}/participants/${participantId}/sessions/${sessionId}`,
  );
}
