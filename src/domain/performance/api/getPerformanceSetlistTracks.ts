import { apiClient } from '@/global/api/apiClient';

import type { PerformanceSetlistTracksResponse } from '../types/res';

export function getPerformanceSetlistTracks(
  performanceId: string,
): Promise<PerformanceSetlistTracksResponse[]> {
  return apiClient.get<PerformanceSetlistTracksResponse[]>(
    `/api/v1/performances/${performanceId}/setlists/tracks`,
  );
}
