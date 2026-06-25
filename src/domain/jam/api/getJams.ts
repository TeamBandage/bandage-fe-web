import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { JamListItemResponse } from '../types';

type GetJamsParams = {
  bandId?: string;
  lastId?: string;
  pageSize: number;
};

export async function getJams(
  params: GetJamsParams,
): Promise<CursorResponse<JamListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<JamListItemResponse, string> | null>(
    '/api/v1/jams',
    {
      query: {
        bandId: params.bandId,
        lastId: params.lastId,
        pageSize: params.pageSize,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
