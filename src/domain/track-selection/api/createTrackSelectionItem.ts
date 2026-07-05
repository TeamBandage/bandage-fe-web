import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionItemCreateRequest } from '../types/req';
import type { TrackSelectionItemResponse } from '../types/res';

export async function createTrackSelectionItem(
  selectionId: string,
  body: TrackSelectionItemCreateRequest,
): Promise<TrackSelectionItemResponse> {
  return apiClient.post<TrackSelectionItemResponse>(
    `/api/v1/track-selections/${selectionId}/items`,
    body,
  );
}
