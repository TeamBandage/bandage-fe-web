import { apiClient } from '@/global/api/apiClient';

import type { UpdateScheduleRequest } from '../types';

export async function updateSchedule(
  practiceId: string,
  req: UpdateScheduleRequest,
): Promise<void> {
  await apiClient.patch<null>(`/api/v1/practices/${practiceId}/schedule`, req);
}
