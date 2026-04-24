import { apiClient } from '@/global/api/apiClient';

import type { PasswordChangeRequest } from '../types';

export async function changePassword(req: PasswordChangeRequest): Promise<void> {
  await apiClient.patch<null>('/api/v1/auth/password', req);
}
