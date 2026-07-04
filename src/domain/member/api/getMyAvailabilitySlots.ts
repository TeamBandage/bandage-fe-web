import { apiClient } from '@/global/api/apiClient';

import type { ScheduleSlotResponse } from '../types';

export async function getMyAvailabilitySlots(
  from: string,
  to: string,
): Promise<ScheduleSlotResponse[]> {
  const data = await apiClient.get<ScheduleSlotResponse[] | null>('/api/v1/me/availability/slots', {
    query: { from, to },
  });
  return data ?? [];
}
