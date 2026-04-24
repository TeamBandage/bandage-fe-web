import { apiClient } from '@/global/api/apiClient';

import type { AddPerformancePracticeRequest, PerformancePracticeResponse } from '../types';

export async function addPerformancePractice(
  performanceId: string,
  req: AddPerformancePracticeRequest,
): Promise<PerformancePracticeResponse> {
  const data = await apiClient.post<PerformancePracticeResponse>(
    `/api/v1/performances/${performanceId}/practices`,
    req,
  );
  if (!data) throw new Error('공연 합주 추가 응답이 비어 있습니다.');
  return data;
}
