'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getSetlistByTitle } from '../api';
import type { SetlistResponse } from '../types/res';

/** GET /api/v1/setlists/by-title — 제목으로 셋리스트 검색. 빈 검색어는 enabled=false 로 보호. */
export function useSetlistsByTitle(
  title: string,
  pageSize: number = 20,
  options?: { enabled?: boolean },
) {
  const trimmed = title.trim();
  return useInfiniteCursor<SetlistResponse, string>(
    queryKeys.setlist.search(trimmed),
    ({ lastId, pageSize: size }) => getSetlistByTitle({ title: trimmed, lastId, pageSize: size }),
    pageSize,
    { enabled: (options?.enabled ?? true) && trimmed.length > 0 },
  );
}
