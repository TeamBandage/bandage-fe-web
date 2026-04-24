import { apiClient } from '@/global/api/apiClient';

import type { PerformanceDetailResponse } from '../types';

export async function getPerformanceDetail(
  performanceId: string,
): Promise<PerformanceDetailResponse | null> {
  return apiClient.get<PerformanceDetailResponse | null>(`/api/v1/performances/${performanceId}`);
}
