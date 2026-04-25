import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { MyBandInfoResponse } from '../types';

type GetMyBandsParams = {
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §3-3-1 — 현재 로그인 회원이 소속된 밴드 목록 (myRole 포함). */
export async function getMyBands(
  params: GetMyBandsParams,
): Promise<CursorResponse<MyBandInfoResponse, string>> {
  const data = await apiClient.get<CursorResponse<MyBandInfoResponse, string> | null>(
    '/api/v1/bands/me',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
