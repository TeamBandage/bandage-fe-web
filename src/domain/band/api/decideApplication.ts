import { apiClient } from '@/global/api/apiClient';

import type { BandApplicationDecision } from '../types';

/**
 * 리더가 밴드 가입 신청을 승인/거절합니다.
 * API_SPEC 3-9: PATCH /api/v1/bands/{bandId}/applications/{bandApplicationId}?status=APPROVED|REJECTED
 */
export async function decideApplication(
  bandId: string,
  applicationId: string,
  decision: BandApplicationDecision,
): Promise<void> {
  await apiClient.patch<null>(`/api/v1/bands/${bandId}/applications/${applicationId}`, undefined, {
    query: { status: decision },
  });
}
