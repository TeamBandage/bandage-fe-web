import { apiClient } from '@/global/api/apiClient';

import type { MemberAvailabilityResponse } from '../types';

export async function getMyAvailability(): Promise<MemberAvailabilityResponse> {
  return apiClient.get<MemberAvailabilityResponse>('/api/v1/me/availability');
}
