import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionDetailResponse } from '../types/res';

export async function getTrackSelection(
  selectionId: string,
): Promise<TrackSelectionDetailResponse> {
  return apiClient.get<TrackSelectionDetailResponse>(`/api/v1/track-selections/${selectionId}`);
}
