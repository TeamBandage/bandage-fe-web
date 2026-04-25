import { apiClient } from '@/global/api/apiClient';

import type { PracticeSongResponse } from '../types';

type CreateFromFieldsRequest = {
  practiceId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  refLink?: string | null;
};

/** API_SPEC §5-2 — 자작곡 등 외부 API 미사용 시 필드 직접 입력. */
export async function createPracticeSongFromFields(
  req: CreateFromFieldsRequest,
): Promise<PracticeSongResponse> {
  const data = await apiClient.post<PracticeSongResponse>('/api/v1/practice-songs', req);
  if (!data) throw new Error('합주곡 생성 응답이 비어 있습니다.');
  return data;
}
