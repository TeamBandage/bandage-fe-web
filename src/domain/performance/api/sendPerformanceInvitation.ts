import { apiClient } from '@/global/api/apiClient';

import type { PerformanceInvitationCreateRequest } from '../types/req';
import type { PerformanceInvitationResponse } from '../types/res';

export function sendPerformanceInvitation(
  performanceId: string,
  body: PerformanceInvitationCreateRequest,
): Promise<PerformanceInvitationResponse> {
  return apiClient.post<PerformanceInvitationResponse>(
    `/api/v1/performances/${performanceId}/invitations`,
    body,
  );
}
