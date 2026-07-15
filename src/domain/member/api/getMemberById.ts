import { apiClient } from '@/global/api/apiClient';

import type { MemberSearchItemResponse } from '../types';

/** 회원 정보 조회(회원 ID) */
export async function getMemberById(memberId: number): Promise<MemberSearchItemResponse> {
  return apiClient.get<MemberSearchItemResponse>(`/api/v1/members/${memberId}`);
}
