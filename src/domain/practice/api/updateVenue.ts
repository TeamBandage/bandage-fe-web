import { apiClient } from '@/global/api/apiClient';

import type { UpdateVenueRequest } from '../types';

export async function updateVenue(practiceId: string, req: UpdateVenueRequest): Promise<void> {
  await apiClient.patch<null>(`/api/v1/practices/${practiceId}/venue`, req);
}
