import { apiClient } from '@/global/api/apiClient';

import type { UpdateTrackSelectionRequest } from '../types/req';
import type { TrackSelectionResponse } from '../types/res';

export async function updateTrackSelection(
  selectionId: string,
  body: UpdateTrackSelectionRequest,
): Promise<TrackSelectionResponse> {
  return apiClient.patch<TrackSelectionResponse>(`/api/v1/track-selections/${selectionId}`, body);
}
