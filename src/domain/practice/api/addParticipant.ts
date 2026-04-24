import { apiClient } from '@/global/api/apiClient';

import type { AddParticipantRequest, AddParticipantResponse } from '../types';

export async function addParticipant(
  practiceId: string,
  req: AddParticipantRequest,
): Promise<AddParticipantResponse> {
  const data = await apiClient.post<AddParticipantResponse>(
    `/api/v1/practices/${practiceId}/participants`,
    req,
  );
  if (!data) throw new Error('참여자 추가 응답이 비어 있습니다.');
  return data;
}
