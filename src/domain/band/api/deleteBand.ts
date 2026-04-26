import { apiClient } from '@/global/api/apiClient';

/**
 * API_REQUIRED FE-API-023 — `DELETE /api/v1/bands/{bandId}` (백엔드 미지원 시 4xx).
 * 권한: 리더만. 응답 204.
 */
export async function deleteBand(bandId: string): Promise<void> {
  await apiClient.delete(`/api/v1/bands/${bandId}`);
}
