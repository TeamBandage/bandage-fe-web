import { apiClient } from '@/global/api/apiClient';

import type { JamDetailResponse } from '../types';

export async function getJam(jamId: string): Promise<JamDetailResponse | null> {
  return apiClient.get<JamDetailResponse | null>(`/api/v1/jams/${jamId}`);
}
