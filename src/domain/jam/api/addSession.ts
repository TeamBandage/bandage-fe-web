import { apiClient } from '@/global/api/apiClient';

import type { SessionDefDto } from '../types/req';
import type { JamSessionResponse } from '../types/res';

export async function addSession(jamId: string, body: SessionDefDto): Promise<JamSessionResponse> {
  return apiClient.post<JamSessionResponse>(`/api/v1/jams/${jamId}/sessions`, body);
}
