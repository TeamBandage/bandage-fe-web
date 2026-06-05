import { apiClient } from '@/global/api/apiClient';

import type { MemberAvailabilityResponse, UpdateMyAvailabilityRequest } from '../types';

export async function updateMyAvailability(
  req: UpdateMyAvailabilityRequest,
): Promise<MemberAvailabilityResponse> {
  return apiClient.put<MemberAvailabilityResponse>('/api/v1/me/availability', req);
}
