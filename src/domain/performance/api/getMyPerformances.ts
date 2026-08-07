import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PerformanceListItemResponse } from '../types';

type GetMyPerformancesParams = {
  lastId?: string;
  pageSize: number;
  /** 조회 시작일(yyyy-MM-dd, inclusive). 주간 단위 조회 시 사용. */
  from?: string;
  /** 조회 종료일(yyyy-MM-dd, inclusive). 주간 단위 조회 시 사용. */
  to?: string;
};

/** API_SPEC §6-2-1 — 현재 로그인 회원의 소속 밴드가 참여하는 모든 공연. from/to 로 기간 필터링 가능. */
export async function getMyPerformances(
  params: GetMyPerformancesParams,
): Promise<CursorResponse<PerformanceListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<PerformanceListItemResponse, string> | null>(
    '/api/v1/performances/me',
    {
      query: {
        lastId: params.lastId,
        pageSize: params.pageSize,
        from: params.from,
        to: params.to,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
