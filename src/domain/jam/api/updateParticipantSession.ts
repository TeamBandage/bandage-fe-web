import { apiClient } from '@/global/api/apiClient';

import type { JamParticipantResponse, UpdateParticipantSessionRequest } from '../types';

export async function updateParticipantSession(
  jamId: string,
  participantId: string,
  req: UpdateParticipantSessionRequest,
): Promise<JamParticipantResponse> {
  const data = await apiClient.patch<JamParticipantResponse>(
    `/api/v1/jams/${jamId}/participants/${participantId}/session`,
    req,
  );
  if (!data) throw new Error('세션 배정 응답이 비어 있습니다.');
  return data;
}
