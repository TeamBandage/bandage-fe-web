import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { BandMemberInfoResponse } from '../types';

type GetBandMembersParams = {
  lastId?: string;
  pageSize: number;
};

export async function getBandMembers(
  bandId: string,
  params: GetBandMembersParams,
): Promise<CursorResponse<BandMemberInfoResponse, string>> {
  const data = await apiClient.get<CursorResponse<BandMemberInfoResponse, string> | null>(
    `/api/v1/bands/${bandId}/members`,
    { query: { lastId: params.lastId, pageSize: params.pageSize } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
