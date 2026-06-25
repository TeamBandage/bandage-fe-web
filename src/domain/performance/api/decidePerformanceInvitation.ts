import { apiClient } from '@/global/api/apiClient';

import type { PerformanceInvitationStatus } from '../types/res';

export function decidePerformanceInvitation(
  performanceId: string,
  invitationId: string,
  status: Extract<PerformanceInvitationStatus, 'ACCEPTED' | 'REJECTED'>,
): Promise<void> {
  return apiClient.patch<void>(
    `/api/v1/performances/${performanceId}/invitations/${invitationId}`,
    undefined,
    { query: { status } },
  );
}
