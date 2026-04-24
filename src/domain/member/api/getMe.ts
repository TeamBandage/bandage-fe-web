import { apiClient } from '@/global/api/apiClient';

import type { MemberInfoResponse } from '../types';

export async function getMe(): Promise<MemberInfoResponse | null> {
  return apiClient.get<MemberInfoResponse | null>('/api/v1/members/me');
}
