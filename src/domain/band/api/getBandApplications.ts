import { apiClient } from '@/global/api/apiClient';
import type { ApplicationStatus, CursorResponse } from '@/global/types';

import type { BandApplicationInfoResponse } from '../types';

type GetBandApplicationsParams = {
  lastId?: string;
  pageSize: number;
  status?: ApplicationStatus;
};

export async function getBandApplications(
  bandId: string,
  params: GetBandApplicationsParams,
): Promise<CursorResponse<BandApplicationInfoResponse, string>> {
  const data = await apiClient.get<CursorResponse<BandApplicationInfoResponse, string> | null>(
    `/api/v1/bands/${bandId}/applications`,
    { query: { lastId: params.lastId, pageSize: params.pageSize, status: params.status } },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}
