import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionResponse } from '../types/res';

/** 선곡 회의 매니저 권한을 다른 참여자에게 양도. */
export async function transferManager(
  selectionId: string,
  managerId: number,
): Promise<TrackSelectionResponse> {
  return apiClient.patch<TrackSelectionResponse>(
    `/api/v1/track-selections/${selectionId}/manager`,
    { managerId },
  );
}
