import { apiClient } from '@/global/api/apiClient';

import type { UpdatePerformanceRequest } from '../types';

export async function updatePerformance(
  performanceId: string,
  req: UpdatePerformanceRequest,
): Promise<void> {
  await apiClient.patch<null>(`/api/v1/performances/${performanceId}`, req);
}
