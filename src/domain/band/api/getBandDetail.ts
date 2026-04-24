import { apiClient } from '@/global/api/apiClient';

import type { BandInfoResponse } from '../types';

export async function getBandDetail(bandId: string): Promise<BandInfoResponse | null> {
  return apiClient.get<BandInfoResponse | null>(`/api/v1/bands/${bandId}`);
}
