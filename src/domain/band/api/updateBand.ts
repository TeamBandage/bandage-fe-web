import { apiClient } from '@/global/api/apiClient';

export interface UpdateBandRequest {
  name?: string;
  description?: string;
  profileImg?: string | null;
}

/**
 * API_REQUIRED FE-API-022 — `PATCH /api/v1/bands/{bandId}` (백엔드 미지원 시 4xx).
 * 백엔드 도입 후 fetcher 변경 없이 즉시 활성화.
 */
export async function updateBand(bandId: string, req: UpdateBandRequest): Promise<void> {
  await apiClient.patch(`/api/v1/bands/${bandId}`, req);
}
