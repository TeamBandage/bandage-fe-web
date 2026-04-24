import { apiClient } from '@/global/api/apiClient';

import type { BatchAddPerformancePracticeRequest, PerformancePracticeResponse } from '../types';

/**
 * 기존 합주들을 공연에 일괄 연결.
 * API_SPEC 6-6: 응답은 배열(`List<PerformancePracticeResponse>`).
 */
export async function batchAddPerformancePractices(
  performanceId: string,
  req: BatchAddPerformancePracticeRequest,
): Promise<PerformancePracticeResponse[]> {
  const data = await apiClient.post<PerformancePracticeResponse[]>(
    `/api/v1/performances/${performanceId}/practices/batch`,
    req,
  );
  return data ?? [];
}
