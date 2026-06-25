import { apiClient } from '@/global/api/apiClient';

import type { PerformanceSetlistAddRequest } from '../types/req';
import type { PerformanceSetlistResponse } from '../types/res';

export function batchAddPerformanceSetlists(
  performanceId: string,
  body: PerformanceSetlistAddRequest,
): Promise<PerformanceSetlistResponse[]> {
  return apiClient.post<PerformanceSetlistResponse[]>(
    `/api/v1/performances/${performanceId}/setlists/batch`,
    body,
  );
}
