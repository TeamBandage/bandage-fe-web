import { apiClient } from '@/global/api/apiClient';

import type { PracticeSongResponse } from '../types';

type CreateFromFieldsRequest = {
  /** Optional — 미제공 시 PracticeSong 만 생성, 응답 songId 를 POST /practices 의 song 으로 후바인딩. */
  practiceId?: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  refLink?: string | null;
};

/**
 * API_SPEC §5-2 — 자작곡 등 외부 API 미사용 시 필드 직접 입력.
 * 마법사 시나리오에서는 practiceId 생략.
 */
export async function createPracticeSongFromFields(
  req: CreateFromFieldsRequest,
): Promise<PracticeSongResponse> {
  const data = await apiClient.post<PracticeSongResponse>('/api/v1/practice-songs', req);
  if (!data) throw new Error('합주곡 생성 응답이 비어 있습니다.');
  return data;
}
