import { apiClient } from '@/global/api/apiClient';

import type { CreatePerformanceRequest, CreatePerformanceResponse } from '../types';

export async function createPerformance(
  req: CreatePerformanceRequest,
): Promise<CreatePerformanceResponse> {
  const data = await apiClient.post<CreatePerformanceResponse>('/api/v1/performances', req);
  if (!data) throw new Error('공연 생성 응답이 비어 있습니다.');
  return data;
}
