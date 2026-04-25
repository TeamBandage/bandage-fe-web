import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PracticeListItemResponse } from '../types';

type SearchMyPracticesParams = {
  keyword: string;
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §4-1-3 — 본인 참여 합주 중 합주 타이틀/곡 제목에 keyword 포함. */
export async function searchMyPractices(
  params: SearchMyPracticesParams,
): Promise<CursorResponse<PracticeListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PracticeListItemResponse, string> | null>(
    '/api/v1/practices/me/search',
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
