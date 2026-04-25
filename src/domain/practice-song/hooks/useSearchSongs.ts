'use client';

import { useQuery } from '@tanstack/react-query';

import { searchSongs } from '../api/searchSongs';
import type { SongSearchItem } from '../types';

/**
 * 합주곡 검색 (디바운스는 호출부 책임).
 * 빈 keyword 는 enabled=false. staleTime 은 mock 반환 특성상 짧게.
 */
export function useSearchSongs(keyword: string) {
  const trimmed = keyword.trim();
  return useQuery<SongSearchItem[], Error>({
    queryKey: ['practice-song', 'search', trimmed],
    queryFn: () => searchSongs(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 30 * 1000,
  });
}
