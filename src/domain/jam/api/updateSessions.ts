import { apiClient } from '@/global/api/apiClient';

import type { JamSessionsUpdateRequest } from '../types/req';
import type { JamDetailResponse } from '../types/res';

/** PUT /api/v1/jams/{jamId}/sessions — 세션 정의 목록 전체 교체. */
export async function updateSessions(
  jamId: string,
  body: JamSessionsUpdateRequest,
): Promise<JamDetailResponse> {
  const data = await apiClient.put<JamDetailResponse>(`/api/v1/jams/${jamId}/sessions`, body);
  if (!data) throw new Error('세션 정의 교체 응답이 비어 있습니다.');
  return data;
}
