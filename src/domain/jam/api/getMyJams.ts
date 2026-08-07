import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { JamListItemResponse } from '../types';

type GetMyPracticesParams = {
  lastId?: string;
  pageSize: number;
  /** 조회 시작일(yyyy-MM-dd, inclusive). 주간 단위 조회 시 사용. */
  from?: string;
  /** 조회 종료일(yyyy-MM-dd, inclusive). 주간 단위 조회 시 사용. */
  to?: string;
};

/** API_SPEC §4-1-1 — 현재 로그인 회원이 참여 중인 합주 목록. from/to 로 기간 필터링 가능. */
export async function getMyJams(
  params: GetMyPracticesParams,
): Promise<CursorResponse<JamListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<JamListItemResponse, string> | null>(
    '/api/v1/jams/me',
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
