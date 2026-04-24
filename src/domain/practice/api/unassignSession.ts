import { apiClient } from '@/global/api/apiClient';

/**
 * 본인의 세션 배정을 해제합니다. (API_SPEC 4-7)
 * DELETE /api/v1/practices/{practiceId}/sessions/{sessionId}/assignment
 */
export async function unassignSession(practiceId: string, sessionId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/practices/${practiceId}/sessions/${sessionId}/assignment`);
}
