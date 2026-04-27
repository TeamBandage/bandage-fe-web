/**
 * 선곡 회의 BE API fetcher 모음 — API_SPEC §7.
 *
 * 현재 FE 의 메인 흐름은 Zustand mock(`store/setlistStore.ts`) 을 사용.
 * 이 fetcher 들은 BE 도입 단계에서 store action 을 점진적으로 교체하기 위해 미리 준비된 표면이다.
 */
import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type {
  ConfirmSessionRequest,
  CreateChatMessageRequest,
  CreateSetlistItemRequest,
  CreateSetlistMeetingRequest,
  SetlistItemChatMessageResponse,
  SetlistItemResponse,
  SetlistMeetingDetailResponse,
  SetlistMeetingResponse,
  UpdateSetlistItemRequest,
  UpdateSetlistMeetingRequest,
} from '../types/api';

const PREFIX = '/api/v1/setlist-meetings';

// ─── 회의 ─────────────────────────────────────────────────────────────

/** §7-1. */
export function createSetlistMeeting(
  body: CreateSetlistMeetingRequest,
): Promise<SetlistMeetingResponse> {
  return apiClient.post<SetlistMeetingResponse>(PREFIX, body);
}

/** §7-2. */
export function getMySetlistMeetings(params?: {
  lastId?: string;
  pageSize?: number;
}): Promise<CursorResponse<SetlistMeetingResponse, string>> {
  return apiClient.get<CursorResponse<SetlistMeetingResponse, string>>(`${PREFIX}/me`, {
    query: params,
  });
}

/** §7-3. */
export function getSetlistMeeting(meetingId: string): Promise<SetlistMeetingDetailResponse> {
  return apiClient.get<SetlistMeetingDetailResponse>(`${PREFIX}/${meetingId}`);
}

/** §7-4. */
export function updateSetlistMeeting(
  meetingId: string,
  body: UpdateSetlistMeetingRequest,
): Promise<SetlistMeetingResponse> {
  return apiClient.patch<SetlistMeetingResponse>(`${PREFIX}/${meetingId}`, body);
}

/** §7-5. */
export function deleteSetlistMeeting(meetingId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${meetingId}`);
}

// ─── 곡(Item) ─────────────────────────────────────────────────────────

/** §7-6. */
export function getSetlistItems(
  meetingId: string,
  params?: { lastId?: string; pageSize?: number },
): Promise<CursorResponse<SetlistItemResponse, string>> {
  return apiClient.get<CursorResponse<SetlistItemResponse, string>>(
    `${PREFIX}/${meetingId}/items`,
    { query: params },
  );
}

/** §7-7. */
export function getSetlistItem(meetingId: string, itemId: string): Promise<SetlistItemResponse> {
  return apiClient.get<SetlistItemResponse>(`${PREFIX}/${meetingId}/items/${itemId}`);
}

/** §7-8. */
export function createSetlistItem(
  meetingId: string,
  body: CreateSetlistItemRequest,
): Promise<SetlistItemResponse> {
  return apiClient.post<SetlistItemResponse>(`${PREFIX}/${meetingId}/items`, body);
}

/** §7-9. */
export function updateSetlistItem(
  meetingId: string,
  itemId: string,
  body: UpdateSetlistItemRequest,
): Promise<SetlistItemResponse> {
  return apiClient.patch<SetlistItemResponse>(`${PREFIX}/${meetingId}/items/${itemId}`, body);
}

/** §7-10. */
export function deleteSetlistItem(meetingId: string, itemId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${meetingId}/items/${itemId}`);
}

// ─── 세션 지원/확정 ──────────────────────────────────────────────────

/** §7-11. */
export function applySession(
  meetingId: string,
  itemId: string,
  sessionId: string,
): Promise<SetlistItemResponse> {
  return apiClient.post<SetlistItemResponse>(
    `${PREFIX}/${meetingId}/items/${itemId}/sessions/${sessionId}/applicants`,
    {},
  );
}

/** §7-12. */
export function withdrawSession(
  meetingId: string,
  itemId: string,
  sessionId: string,
  userId: number,
): Promise<void> {
  return apiClient.delete<void>(
    `${PREFIX}/${meetingId}/items/${itemId}/sessions/${sessionId}/applicants/${userId}`,
  );
}

/** §7-13. */
export function patchConfirmations(
  meetingId: string,
  itemId: string,
  sessionId: string,
  body: ConfirmSessionRequest,
): Promise<SetlistItemResponse> {
  return apiClient.patch<SetlistItemResponse>(
    `${PREFIX}/${meetingId}/items/${itemId}/sessions/${sessionId}/confirmations`,
    body,
  );
}

// ─── 채팅 ─────────────────────────────────────────────────────────────

/** §7-14. */
export function getItemChat(
  meetingId: string,
  itemId: string,
  params?: { lastId?: string; pageSize?: number },
): Promise<CursorResponse<SetlistItemChatMessageResponse, string>> {
  return apiClient.get<CursorResponse<SetlistItemChatMessageResponse, string>>(
    `${PREFIX}/${meetingId}/items/${itemId}/chat`,
    { query: params },
  );
}

/** §7-15. */
export function postItemChat(
  meetingId: string,
  itemId: string,
  body: CreateChatMessageRequest,
): Promise<SetlistItemChatMessageResponse> {
  return apiClient.post<SetlistItemChatMessageResponse>(
    `${PREFIX}/${meetingId}/items/${itemId}/chat`,
    body,
  );
}

// ─── 잠금/해제 ────────────────────────────────────────────────────────

/** §7-16. */
export function lockSetlistMeeting(meetingId: string): Promise<SetlistMeetingResponse> {
  return apiClient.post<SetlistMeetingResponse>(`${PREFIX}/${meetingId}/lock`, {});
}

/** §7-17. */
export function unlockSetlistMeeting(meetingId: string): Promise<SetlistMeetingResponse> {
  return apiClient.post<SetlistMeetingResponse>(`${PREFIX}/${meetingId}/unlock`, {});
}
