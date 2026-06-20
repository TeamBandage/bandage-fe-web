import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { JamListItemResponse } from '../types';

type GetPracticesParams = {
  bandId?: string;
  lastId?: string;
  pageSize: number;
};

/**
 * 합주 목록 (커서 페이징).
 * NOTE: API_SPEC v1 에는 정식 등재되지 않은 추측 엔드포인트. Performance 목록(6-2) 과 동일 패턴을 가정.
 *   - 실제 경로: GET /api/v1/practices?bandId=...&lastId=...&pageSize=...
 *   - 백엔드 미구현 시 apiClient 가 404/HTTP 에러로 ApiError 를 throw 하므로
 *     호출부(useInfiniteCursor 래퍼)에서 ErrorState 로 안전하게 처리.
 */
export async function getJams(
  params: GetPracticesParams,
): Promise<CursorResponse<JamListItemResponse, string>> {
  const data = await apiClient.get<CursorResponse<JamListItemResponse, string> | null>(
    '/api/v1/jams',
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
