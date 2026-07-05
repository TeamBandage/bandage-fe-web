import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionItemUpdateRequest } from '../types/req';
import type { TrackSelectionItemResponse } from '../types/res';

export async function updateTrackSelectionItem(
  selectionId: string,
  itemId: string,
  body: TrackSelectionItemUpdateRequest,
): Promise<TrackSelectionItemResponse> {
  return apiClient.patch<TrackSelectionItemResponse>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}`,
    body,
  );
}
