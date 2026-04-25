import { apiClient } from '@/global/api/apiClient';

import type { SongSearchItem } from '../types';

/** API_SPEC §5-1 — 곡 제목/아티스트 검색. 현재 백엔드는 Tool 곡 고정 mock 반환. */
export async function searchSongs(keyword: string): Promise<SongSearchItem[]> {
  const data = await apiClient.get<SongSearchItem[] | null>('/api/v1/practice-songs/search', {
    query: { keyword },
  });
  return data ?? [];
}
