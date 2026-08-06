import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { TrackSelectionItemResponse } from '../types/res';
import type { TrackSelectionItemsFilter } from '../types/req';

type Params = { lastId?: string; pageSize: number } & TrackSelectionItemsFilter;

export async function getTrackSelectionItems(
  selectionId: string,
  params: Params,
): Promise<CursorResponse<TrackSelectionItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<TrackSelectionItemResponse, string> | null>(
    `/api/v1/track-selections/${selectionId}/items`,
    {
      query: {
        lastId: params.lastId,
        pageSize: params.pageSize,
        status: params.status,
        appliedByMe: params.appliedByMe,
        memberName: params.memberName,
        keyword: params.keyword,
        searchFields: params.searchFields,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
