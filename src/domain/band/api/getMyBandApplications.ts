import { apiClient } from '@/global/api/apiClient';
import type { ApplicationStatus } from '@/global/types';
import type { CursorResponse } from '@/global/types';

import type { MyBandApplicationResponse } from '../types/res';

type Params = {
  status?: ApplicationStatus;
  lastId?: string;
  pageSize: number;
};

/** GET /api/v1/band-applications/me — 내 밴드 가입 신청 목록 (status 미지정 시 전체) */
export async function getMyBandApplications(
  params: Params,
): Promise<CursorResponse<MyBandApplicationResponse, string>> {
  const data = await apiClient.get<CursorResponse<MyBandApplicationResponse, string> | null>(
    '/api/v1/band-applications/me',
    {
      query: {
        status: params.status,
        lastId: params.lastId,
        pageSize: params.pageSize,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
