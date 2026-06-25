import { apiClient } from '@/global/api/apiClient';

import type { PerformanceInvitationResponse } from '../types/res';

export function getMyPerformanceInvitations(): Promise<PerformanceInvitationResponse[]> {
  return apiClient.get<PerformanceInvitationResponse[]>('/api/v1/performances/invitations/me');
}
