import { apiClient } from '@/global/api/apiClient';

import type { CreateTrackSelectionRequest } from '../types/req';
import type { TrackSelectionResponse } from '../types/res';

export async function createTrackSelection(
  body: CreateTrackSelectionRequest,
): Promise<TrackSelectionResponse> {
  return apiClient.post<TrackSelectionResponse>('/api/v1/track-selections', body);
}
