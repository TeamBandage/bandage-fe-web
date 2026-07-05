import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionItemResponse } from '../types/res';

export async function updateItemSelection(
  selectionId: string,
  itemId: string,
  body: { selected: boolean },
): Promise<TrackSelectionItemResponse> {
  return apiClient.patch<TrackSelectionItemResponse>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/selection`,
    body,
  );
}
