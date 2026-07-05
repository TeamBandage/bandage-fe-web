import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { TrackSelectionItemResponse } from '../types/res';

type Params = { lastId?: string; pageSize: number };

export async function getTrackSelectionItems(
  selectionId: string,
  params: Params,
): Promise<CursorResponse<TrackSelectionItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<TrackSelectionItemResponse, string> | null>(
    `/api/v1/track-selections/${selectionId}/items`,
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
