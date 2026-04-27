import { apiClient } from '@/global/api/apiClient';

/** API_SPEC §3-14 — 밴드 멤버 강퇴 (리더만). 리더 자신은 강퇴 불가. */
export async function removeBandMember(bandId: string, bandMemberId: string): Promise<void> {
  await apiClient.delete<null>(`/api/v1/bands/${bandId}/members/${bandMemberId}`);
}
