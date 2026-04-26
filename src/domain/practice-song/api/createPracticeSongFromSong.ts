import { apiClient } from '@/global/api/apiClient';

import type { PracticeSongResponse, SongSearchItem } from '../types';

type CreateFromSongRequest = {
  /** Optional — 미제공 시 PracticeSong 만 생성, 응답 songId 를 POST /practices 의 song 으로 후바인딩. */
  practiceId?: string;
  song: SongSearchItem;
};

/**
 * API_SPEC §5-3 — 외부 검색 결과(SongSearchItem) 를 그대로 전달해 합주곡 생성.
 * 마법사 시나리오에서는 practiceId 생략 → 응답 songId 를 §4-1 호출에 사용.
 */
export async function createPracticeSongFromSong(
  req: CreateFromSongRequest,
): Promise<PracticeSongResponse> {
  const data = await apiClient.post<PracticeSongResponse>('/api/v1/practice-songs/from-song', req);
  if (!data) throw new Error('합주곡 생성 응답이 비어 있습니다.');
  return data;
}
