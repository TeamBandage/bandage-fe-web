'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getSetlistByTitle } from '../api';

/** GET /api/v1/setlists/by-title — 제목으로 셋리스트 검색. 빈 검색어는 enabled=false 로 보호. */
export function useSetlistsByTitle(title: string, options?: { enabled?: boolean }) {
  const trimmed = title.trim();
  return useQuery({
    queryKey: queryKeys.setlist.search(trimmed),
    queryFn: () => getSetlistByTitle(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
