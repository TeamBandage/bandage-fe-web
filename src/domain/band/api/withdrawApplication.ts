import { apiClient } from '@/global/api/apiClient';

/**
 * PENDING 상태의 본인 신청을 철회합니다.
 * API_SPEC 3-8: PATCH /api/v1/bands/{bandId}/applications/me
 */
export async function withdrawApplication(bandId: string): Promise<void> {
  await apiClient.patch<null>(`/api/v1/bands/${bandId}/applications/me`);
}
