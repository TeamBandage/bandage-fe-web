import { apiClient } from '@/global/api/apiClient';

import type { BandApplicationInfoResponse } from '../types';

/** GET /api/v1/bands/{bandId}/applications/me — 내 가입 신청 단건 조회 (없으면 null) */
export async function getMyApplicationForBand(
  bandId: string,
): Promise<BandApplicationInfoResponse | null> {
  return apiClient.get<BandApplicationInfoResponse | null>(
    `/api/v1/bands/${bandId}/applications/me`,
  );
}
