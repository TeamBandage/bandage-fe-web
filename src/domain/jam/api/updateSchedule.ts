import { apiClient } from '@/global/api/apiClient';

import type { UpdateTimeInfoRequest } from '../types';

export async function updateSchedule(
  practiceId: string,
  req: UpdateTimeInfoRequest,
): Promise<void> {
  await apiClient.patch<null>(`/api/v1/jams/${practiceId}/time-info`, req);
}
