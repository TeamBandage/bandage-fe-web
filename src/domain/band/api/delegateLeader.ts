import { apiClient } from '@/global/api/apiClient';

/**
 * 현재 리더 권한을 지정 멤버에게 양도합니다.
 * API_SPEC 3-10: PATCH /api/v1/bands/{bandId}/members/{bandMemberId}/role
 */
export async function delegateLeader(bandId: string, bandMemberId: string): Promise<void> {
  await apiClient.patch<null>(`/api/v1/bands/${bandId}/members/${bandMemberId}/role`);
}
