'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { searchMembers } from '../api/searchMembers';
import type { MemberSearchItemResponse } from '../types';

/** API_SPEC §2-6 — 글로벌 회원 검색. q 가 빈 문자열이면 호출하지 않고 빈 배열 반환. */
export function useMemberSearch(q: string, options?: { enabled?: boolean }) {
  const authenticated = useIsAuthenticated();
  const trimmed = q.trim();
  return useQuery<MemberSearchItemResponse[], Error>({
    queryKey: queryKeys.member.search(trimmed),
    queryFn: () => searchMembers(trimmed),
    enabled: (options?.enabled ?? true) && authenticated && trimmed.length > 0,
    staleTime: 30 * 1000,
  });
}
