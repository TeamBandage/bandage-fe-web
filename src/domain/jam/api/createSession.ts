import { apiClient } from '@/global/api/apiClient';

import type { UpdateSessionsRequest } from '../types';

export async function updateSessions(jamId: string, req: UpdateSessionsRequest): Promise<void> {
  await apiClient.put<null>(`/api/v1/jams/${jamId}/sessions`, req);
}
