import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type {
  SetlistCreateRequest,
  SetlistToJamRequest,
  SetlistTrackUpdateRequest,
  SetlistUpdateRequest,
} from '../types/req';
import type { SetlistResponse, SetlistTrackResponse } from '../types/res';

const PREFIX = '/api/v1/setlists';

/** 셋리스트 생성 */
export function createSetlist(body: SetlistCreateRequest): Promise<SetlistResponse> {
  return apiClient.post<SetlistResponse>(PREFIX, body);
}

/** 내 셋리스트 목록 (커서 페이징) */
export function getMySetlists(params?: {
  lastId?: string;
  pageSize?: number;
}): Promise<CursorResponse<SetlistResponse, string>> {
  return apiClient.get<CursorResponse<SetlistResponse, string>>(`${PREFIX}/me`, {
    query: { pageSize: params?.pageSize ?? 50, lastId: params?.lastId },
  });
}

/** 제목으로 셋리스트 조회 */
export function getSetlistByTitle(title: string): Promise<SetlistResponse[]> {
  return apiClient.get<SetlistResponse[]>(`${PREFIX}/by-title`, { query: { title } });
}

/** 셋리스트 단건 조회 */
export function getSetlist(setlistId: string): Promise<SetlistResponse> {
  return apiClient.get<SetlistResponse>(`${PREFIX}/${setlistId}`);
}

/** 셋리스트 타이틀 수정 */
export function updateSetlist(
  setlistId: string,
  body: SetlistUpdateRequest,
): Promise<SetlistResponse> {
  return apiClient.patch<SetlistResponse>(`${PREFIX}/${setlistId}`, body);
}

/** 셋리스트 기반 합주 일괄 생성 */
export function createJamsFromSetlist(setlistId: string, body: SetlistToJamRequest): Promise<void> {
  return apiClient.post<void>(`${PREFIX}/${setlistId}/jams`, body);
}

/** 셋리스트 트랙 목록 조회 */
export function getSetlistTracks(
  setlistId: string,
): Promise<CursorResponse<SetlistTrackResponse, string>> {
  return apiClient.get<CursorResponse<SetlistTrackResponse, string>>(
    `${PREFIX}/${setlistId}/tracks`,
  );
}

/** 셋리스트 트랙 단건 조회 */
export function getSetlistTrack(setlistId: string, trackId: string): Promise<SetlistTrackResponse> {
  return apiClient.get<SetlistTrackResponse>(`${PREFIX}/${setlistId}/tracks/${trackId}`);
}

/** 셋리스트 트랙 수정 */
export function updateSetlistTrack(
  setlistId: string,
  trackId: string,
  body: SetlistTrackUpdateRequest,
): Promise<SetlistTrackResponse> {
  return apiClient.patch<SetlistTrackResponse>(`${PREFIX}/${setlistId}/tracks/${trackId}`, body);
}

/** 셋리스트 트랙 삭제 */
export function deleteSetlistTrack(setlistId: string, trackId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${setlistId}/tracks/${trackId}`);
}
