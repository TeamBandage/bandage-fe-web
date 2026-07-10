import { apiClient } from '@/global/api/apiClient';

import type { UpdateSessionRequest } from '../types/req';
import type { JamSessionResponse } from '../types/res';

export async function updateSession(
  jamId: string,
  sessionId: string,
  body: UpdateSessionRequest,
): Promise<JamSessionResponse> {
  return apiClient.patch<JamSessionResponse>(`/api/v1/jams/${jamId}/sessions/${sessionId}`, body);
}
