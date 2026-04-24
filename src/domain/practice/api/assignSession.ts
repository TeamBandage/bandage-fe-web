import { apiClient } from '@/global/api/apiClient';

/**
 * 본인을 해당 세션에 배정합니다. (API_SPEC 4-6)
 * PATCH /api/v1/practices/{practiceId}/sessions/{sessionId}/assignment
 */
export async function assignSession(practiceId: string, sessionId: string): Promise<void> {
  await apiClient.patch<null>(`/api/v1/practices/${practiceId}/sessions/${sessionId}/assignment`);
}
