import { apiClient } from '@/global/api/apiClient';

import type { TrackSelectionDetailResponse } from '../types/res';

export interface ParticipantAddDto {
  memberId: number;
  bandIds: string[];
}

export interface UpdateParticipantsRequest {
  add: ParticipantAddDto[];
  remove: number[];
}

export async function updateParticipants(
  selectionId: string,
  body: UpdateParticipantsRequest,
): Promise<TrackSelectionDetailResponse> {
  return apiClient.patch<TrackSelectionDetailResponse>(
    `/api/v1/track-selections/${selectionId}/participants`,
    body,
  );
}
