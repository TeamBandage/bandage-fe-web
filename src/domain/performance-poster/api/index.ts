import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type {
  CreatePerformancePosterRequest,
  PerformancePosterPresignRequest,
  UpdatePerformancePosterRequest,
} from '../types/req';
import type { PerformancePosterPresignResponse, PerformancePosterResponse } from '../types/res';

const PREFIX = '/api/v1/performance-posters';

export async function issuePerformancePosterPresignedUrl(
  performanceId: string,
  req: PerformancePosterPresignRequest,
): Promise<PerformancePosterPresignResponse> {
  const data = await apiClient.post<PerformancePosterPresignResponse>(
    `${PREFIX}/presigned-url`,
    req,
    { query: { performanceId } },
  );
  if (!data) throw new Error('presigned URL 응답이 비어 있습니다.');
  return data;
}

export async function getPerformancePosters(params: {
  performanceId?: string;
  lastId?: string;
  pageSize: number;
}): Promise<CursorResponse<PerformancePosterResponse, string>> {
  const data = await apiClient.get<CursorResponse<PerformancePosterResponse, string> | null>(
    PREFIX,
    {
      query: {
        performanceId: params.performanceId,
        lastId: params.lastId,
        pageSize: params.pageSize,
      },
    },
  );
  return data ?? { content: [], nextCursor: null, hasNext: false };
}

export async function createPerformancePoster(
  req: CreatePerformancePosterRequest,
): Promise<PerformancePosterResponse> {
  const data = await apiClient.post<PerformancePosterResponse>(PREFIX, req);
  if (!data) throw new Error('공연 포스터 생성 응답이 비어 있습니다.');
  return data;
}

export async function getPerformancePoster(posterId: string): Promise<PerformancePosterResponse> {
  const data = await apiClient.get<PerformancePosterResponse>(`${PREFIX}/${posterId}`);
  if (!data) throw new Error('공연 포스터를 찾을 수 없습니다.');
  return data;
}

export async function updatePerformancePoster(
  posterId: string,
  req: UpdatePerformancePosterRequest,
): Promise<PerformancePosterResponse> {
  const data = await apiClient.patch<PerformancePosterResponse>(`${PREFIX}/${posterId}`, req);
  if (!data) throw new Error('공연 포스터 수정 응답이 비어 있습니다.');
  return data;
}

export async function deletePerformancePoster(posterId: string): Promise<void> {
  await apiClient.delete<void>(`${PREFIX}/${posterId}`);
}
