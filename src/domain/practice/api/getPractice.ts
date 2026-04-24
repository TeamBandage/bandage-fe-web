import { apiClient } from '@/global/api/apiClient';

import type { PracticeDetailResponse } from '../types';

export async function getPractice(practiceId: string): Promise<PracticeDetailResponse | null> {
  return apiClient.get<PracticeDetailResponse | null>(`/api/v1/practices/${practiceId}`);
}
