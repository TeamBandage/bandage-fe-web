import { apiClient } from '@/global/api/apiClient';

/** 현재 로그인한 회원이 선곡 회의에서 스스로 떠남. */
export async function leaveSelection(selectionId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/track-selections/${selectionId}/members/me`);
}
