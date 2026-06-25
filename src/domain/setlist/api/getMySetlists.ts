import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { SetlistResponse } from '../types/res';

export async function getMySetlists(params?: {
  lastId?: string;
  pageSize?: number;
}): Promise<CursorResponse<SetlistResponse, string>> {
  return apiClient.get<CursorResponse<SetlistResponse, string>>('/api/v1/setlists/me', {
    query: { pageSize: params?.pageSize ?? 50, lastId: params?.lastId },
  });
}
