import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { BandInfoResponse } from '../types';

type SearchBandsParams = {
  keyword: string;
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §3-3-2 — 밴드명에 keyword 가 포함된 밴드 검색 (대소문자 구분 없음). */
export async function searchBands(
  params: SearchBandsParams,
): Promise<CursorResponse<BandInfoResponse, string>> {
  const data = await apiClient.get<CursorResponse<BandInfoResponse, string> | null>(
    '/api/v1/bands/search',
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
