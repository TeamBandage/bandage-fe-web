import { apiClient } from '@/global/api/apiClient';

import type { PracticeSongResponse, SongSearchItem } from '../types';

type CreateFromSongRequest = {
  practiceId: string;
  song: SongSearchItem;
};

/** API_SPEC §5-3 — 외부 검색 결과(SongSearchItem) 을 그대로 전달해 합주곡 생성. */
export async function createPracticeSongFromSong(
  req: CreateFromSongRequest,
): Promise<PracticeSongResponse> {
  const data = await apiClient.post<PracticeSongResponse>('/api/v1/practice-songs/from-song', req);
  if (!data) throw new Error('합주곡 생성 응답이 비어 있습니다.');
  return data;
}
