import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PracticeListItemResponse } from '../types';

type GetMyPracticesParams = {
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §4-1-1 — 현재 로그인 회원이 참여 중인 합주 목록. */
export async function getMyPractices(
  params: GetMyPracticesParams,
): Promise<CursorResponse<PracticeListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PracticeListItemResponse, string> | null>(
    '/api/v1/practices/me',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
