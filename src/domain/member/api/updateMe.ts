import { apiClient } from '@/global/api/apiClient';

import type { MemberInfoResponse, UpdateMeRequest } from '../types';

export async function updateMe(req: UpdateMeRequest): Promise<MemberInfoResponse | null> {
  return apiClient.patch<MemberInfoResponse | null>('/api/v1/members/me', req);
}
