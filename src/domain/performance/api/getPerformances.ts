import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PerformanceListItemResponse } from '../types';

type GetPerformancesParams = {
  bandId?: string;
  lastId?: string;
  pageSize: number;
};

export async function getPerformances(
  params: GetPerformancesParams,
): Promise<CursorResponse<PerformanceListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PerformanceListItemResponse, string> | null>(
    '/api/v1/performances',
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
