import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { PerformanceInvitationResponse } from '../types/res';

/**
 * 응답이 커서 페이지네이션(CursorResponse)으로 바뀌었다. pageSize(최대 100)는 서버가 필수로
 * 요구한다. lastId 는 UUID 커서.
 */
export function getMyPerformanceInvitations(params?: {
  pageSize?: number;
  lastId?: string;
}): Promise<CursorResponse<PerformanceInvitationResponse, string>> {
  return apiClient.get<CursorResponse<PerformanceInvitationResponse, string>>(
    '/api/v1/performances/invitations/me',
    { query: { pageSize: params?.pageSize ?? 50, lastId: params?.lastId } },
  );
}
