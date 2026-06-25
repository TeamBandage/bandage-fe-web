import { apiClient } from '@/global/api/apiClient';

import type { PerformanceInvitationResponse } from '../types/res';

export function getPerformanceInvitations(
  performanceId: string,
): Promise<PerformanceInvitationResponse[]> {
  return apiClient.get<PerformanceInvitationResponse[]>(
    `/api/v1/performances/${performanceId}/invitations`,
  );
}
