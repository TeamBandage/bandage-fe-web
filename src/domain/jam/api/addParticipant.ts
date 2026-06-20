import { apiClient } from '@/global/api/apiClient';

import type { AddParticipantRequest, JamParticipantResponse } from '../types';

export async function addParticipant(
  jamId: string,
  req: AddParticipantRequest,
): Promise<JamParticipantResponse> {
  const data = await apiClient.post<JamParticipantResponse>(
    `/api/v1/jams/${jamId}/participants`,
    req,
  );
  if (!data) throw new Error('참여자 추가 응답이 비어 있습니다.');
  return data;
}
