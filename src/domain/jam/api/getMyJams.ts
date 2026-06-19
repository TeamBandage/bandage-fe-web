import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { JamListItemResponse } from '../types';

type GetMyPracticesParams = {
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §4-1-1 — 현재 로그인 회원이 참여 중인 합주 목록. */
export async function getMyJams(
  params: GetMyPracticesParams,
): Promise<CursorResponse<JamListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<JamListItemResponse, string> | null>(
    '/api/v1/jams/me',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
