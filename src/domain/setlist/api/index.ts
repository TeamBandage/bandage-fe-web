import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type {
  ScheduleAutoScheduleRequest,
  ScheduleBlockUpsertRequest,
  ScheduleBoardCreateRequest,
  ScheduleBoardUpdateRequest,
  SetlistCreateRequest,
  SetlistToJamRequest,
  SetlistTrackUpdateRequest,
  SetlistUpdateRequest,
} from '../types/req';
import type {
  ScheduleBlockResponse,
  ScheduleBoardResponse,
  SetlistResponse,
  SetlistTrackResponse,
} from '../types/res';

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

/** 셋리스트 삭제 */
export function deleteSetlist(setlistId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${setlistId}`);
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

/** 시간표 시안 목록 조회 */
export function getScheduleBoards(setlistId: string): Promise<ScheduleBoardResponse[]> {
  return apiClient.get<ScheduleBoardResponse[]>(`${PREFIX}/${setlistId}/schedule-boards`);
}

/** 시간표 시안 생성 */
export function createScheduleBoard(
  setlistId: string,
  body: ScheduleBoardCreateRequest,
): Promise<ScheduleBoardResponse> {
  return apiClient.post<ScheduleBoardResponse>(`${PREFIX}/${setlistId}/schedule-boards`, body);
}

/** 시간표 시안 수정 */
export function updateScheduleBoard(
  setlistId: string,
  boardId: string,
  body: ScheduleBoardUpdateRequest,
): Promise<ScheduleBoardResponse> {
  return apiClient.patch<ScheduleBoardResponse>(
    `${PREFIX}/${setlistId}/schedule-boards/${boardId}`,
    body,
  );
}

/** 시간표 시안 삭제 */
export function deleteScheduleBoard(setlistId: string, boardId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${setlistId}/schedule-boards/${boardId}`);
}

/** 시간표 자동 배치 — 기존 배치가 있어도 덮어쓴다. */
export function autoScheduleBoard(
  setlistId: string,
  boardId: string,
  body: ScheduleAutoScheduleRequest,
): Promise<ScheduleBoardResponse> {
  return apiClient.post<ScheduleBoardResponse>(
    `${PREFIX}/${setlistId}/schedule-boards/${boardId}/auto-schedule`,
    body,
  );
}

/** 시간표 블록 등록/수정(upsert) */
export function upsertScheduleBlock(
  setlistId: string,
  boardId: string,
  blockId: string,
  body: ScheduleBlockUpsertRequest,
): Promise<ScheduleBlockResponse> {
  return apiClient.put<ScheduleBlockResponse>(
    `${PREFIX}/${setlistId}/schedule-boards/${boardId}/blocks/${blockId}`,
    body,
  );
}

/** 시간표 블록 삭제 */
export function deleteScheduleBlock(
  setlistId: string,
  boardId: string,
  blockId: string,
): Promise<void> {
  return apiClient.delete<void>(
    `${PREFIX}/${setlistId}/schedule-boards/${boardId}/blocks/${blockId}`,
  );
}

/** 시간표 블록 핀 토글 */
export function setScheduleBlockPin(
  setlistId: string,
  boardId: string,
  blockId: string,
  pinned: boolean,
): Promise<ScheduleBlockResponse> {
  return apiClient.patch<ScheduleBlockResponse>(
    `${PREFIX}/${setlistId}/schedule-boards/${boardId}/blocks/${blockId}/pin`,
    { pinned },
  );
}
