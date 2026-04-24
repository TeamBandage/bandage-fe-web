import { apiClient } from '@/global/api/apiClient';

import type { JoinRequest, JoinResponse } from '../types';

export async function join(req: JoinRequest): Promise<JoinResponse> {
  const data = await apiClient.post<JoinResponse>('/api/v1/members/join', req);
  if (!data) {
    throw new Error('회원가입 응답이 비어 있습니다.');
  }
  return data;
}
