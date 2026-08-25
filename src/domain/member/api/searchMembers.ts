import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type { MemberSearchItemResponse } from '../types';

/**
 * API_SPEC §2-6 — 글로벌 회원 검색.
 * 이름/이메일 부분 일치(대소문자 무시). 본인 제외.
 * 빈 q 는 빈 배열을 반환하도록 호출 측에서 검증.
 *
 * OpenAPI상 파라미터 이름은 "query"(MemberSearchQuery 객체 스키마)로 보이지만, 이는 Spring이
 * 객체를 쿼리 파라미터로 펼쳐 바인딩한다는 뜻일 뿐 — 실제 와이어 키는 그 객체의 필드명
 * (q, pageSize, lastId) 그대로다. pageSize는 서버가 필수로 요구한다.
 */
export async function searchMembers(
  q: string,
  params?: { pageSize?: number; lastId?: number },
): Promise<CursorResponse<MemberSearchItemResponse, number>> {
  return apiClient.get<CursorResponse<MemberSearchItemResponse, number>>('/api/v1/members/search', {
    query: { q, pageSize: params?.pageSize ?? 20, lastId: params?.lastId },
  });
}
