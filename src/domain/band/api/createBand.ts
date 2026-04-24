import { apiClient } from '@/global/api/apiClient';

import type { CreateBandRequest, CreateBandResponse } from '../types';

export async function createBand(req: CreateBandRequest): Promise<CreateBandResponse> {
  const data = await apiClient.post<CreateBandResponse>('/api/v1/bands', req);
  if (!data) {
    throw new Error('밴드 생성 응답이 비어 있습니다.');
  }
  return data;
}
