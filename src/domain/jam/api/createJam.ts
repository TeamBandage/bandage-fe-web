import { apiClient } from '@/global/api/apiClient';

import type { CreateJamRequest, JamResponse } from '../types';

export async function createJam(req: CreateJamRequest): Promise<JamResponse> {
  const data = await apiClient.post<JamResponse>('/api/v1/jams', req);
  if (!data) throw new Error('합주 생성 응답이 비어 있습니다.');
  return data;
}
