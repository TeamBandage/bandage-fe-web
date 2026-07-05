import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { TrackSelectionResponse } from '../types/res';

type GetMyTrackSelectionsParams = {
  lastId?: string;
  pageSize: number;
};

export async function getMyTrackSelections(
  params: GetMyTrackSelectionsParams,
): Promise<CursorResponse<TrackSelectionResponse, string>> {
  const data = await apiClient.get<CursorResponse<TrackSelectionResponse, string> | null>(
    '/api/v1/track-selections/me',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
