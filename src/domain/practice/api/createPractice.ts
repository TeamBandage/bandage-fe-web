import { apiClient } from '@/global/api/apiClient';

import type { CreatePracticeRequest, CreatePracticeResponse } from '../types';

export async function createPractice(req: CreatePracticeRequest): Promise<CreatePracticeResponse> {
  const data = await apiClient.post<CreatePracticeResponse>('/api/v1/practices', req);
  if (!data) throw new Error('합주 생성 응답이 비어 있습니다.');
  return data;
}
