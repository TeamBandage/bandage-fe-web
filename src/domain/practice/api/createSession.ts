import { apiClient } from '@/global/api/apiClient';

import type { CreateSessionRequest, CreateSessionResponse } from '../types';

export async function createSession(
  practiceId: string,
  req: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const data = await apiClient.post<CreateSessionResponse>(
    `/api/v1/practices/${practiceId}/sessions`,
    req,
  );
  if (!data) throw new Error('세션 생성 응답이 비어 있습니다.');
  return data;
}
