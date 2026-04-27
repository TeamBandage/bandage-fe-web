import { apiClient } from '@/global/api/apiClient';

import type { MemberSearchItemResponse } from '../types';

/**
 * API_SPEC §2-6 — 글로벌 회원 검색.
 * 이름/이메일 부분 일치(대소문자 무시). 본인 제외, 최대 20건.
 * 빈 q 는 빈 배열을 반환하도록 호출 측에서 검증.
 */
export async function searchMembers(q: string): Promise<MemberSearchItemResponse[]> {
  return apiClient.get<MemberSearchItemResponse[]>('/api/v1/members/search', {
    query: { q },
  });
}
