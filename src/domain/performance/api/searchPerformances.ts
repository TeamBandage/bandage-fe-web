import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PerformanceListItemResponse } from '../types';

type SearchPerformancesParams = {
  keyword: string;
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §6-2-2 — 공연 제목에 keyword 포함 (대소문자 구분 없음). */
export async function searchPerformances(
  params: SearchPerformancesParams,
): Promise<CursorResponse<PerformanceListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PerformanceListItemResponse, string> | null>(
    '/api/v1/performances/search',
    {
      query: {
        keyword: params.keyword,
        lastId: params.lastId,
        pageSize: params.pageSize,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
