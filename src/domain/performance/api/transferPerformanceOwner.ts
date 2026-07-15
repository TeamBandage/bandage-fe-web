import { apiClient } from '@/global/api/apiClient';

import type { TransferPerformanceOwnerRequest } from '../types/req';

/** 공연 소유권 양도. 기존 OWNER는 MANAGER로 강등되며, OWNER만 수행할 수 있다. */
export async function transferPerformanceOwner(
  performanceId: string,
  req: TransferPerformanceOwnerRequest,
): Promise<void> {
  await apiClient.patch<null>(`/api/v1/performances/${performanceId}/owner`, req);
}
