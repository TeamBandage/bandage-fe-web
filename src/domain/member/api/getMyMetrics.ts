import { apiClient } from '@/global/api/apiClient';

import type { MemberMetricsResponse } from '../types';

/** API_SPEC §2-5 — 본인 메트릭(밴드/다가오는 합주/공연/세션 수). */
export async function getMyMetrics(): Promise<MemberMetricsResponse> {
  return apiClient.get<MemberMetricsResponse>('/api/v1/members/me/metrics');
}
