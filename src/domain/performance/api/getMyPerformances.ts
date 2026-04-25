import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PerformanceListItemResponse } from '../types';

type GetMyPerformancesParams = {
  lastId?: string;
  pageSize: number;
};

/** API_SPEC §6-2-1 — 현재 로그인 회원의 소속 밴드가 참여하는 모든 공연. */
export async function getMyPerformances(
  params: GetMyPerformancesParams,
): Promise<CursorResponse<PerformanceListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PerformanceListItemResponse, string> | null>(
    '/api/v1/performances/me',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
