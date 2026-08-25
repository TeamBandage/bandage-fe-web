'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { searchMembers } from '../api/searchMembers';
import type { MemberSearchItemResponse } from '../types';

/** API_SPEC §2-6 — 글로벌 회원 검색. q 가 빈 문자열이면 호출하지 않는다. */
export function useMemberSearch(q: string, pageSize: number = 20) {
  const authenticated = useIsAuthenticated();
  const trimmed = q.trim();
  return useInfiniteCursor<MemberSearchItemResponse, number>(
    queryKeys.member.search(trimmed),
    ({ lastId, pageSize: size }) => searchMembers(trimmed, { pageSize: size, lastId }),
    pageSize,
    { enabled: authenticated && trimmed.length > 0 },
  );
}
