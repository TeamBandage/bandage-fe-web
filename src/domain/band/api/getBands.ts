import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { BandInfoResponse } from '../types';

type GetBandsParams = {
  lastId?: string;
  pageSize: number;
};

export async function getBands(
  params: GetBandsParams,
): Promise<CursorResponse<BandInfoResponse, string>> {
  const data = await apiClient.get<CursorResponse<BandInfoResponse, string> | null>(
    '/api/v1/bands',
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
