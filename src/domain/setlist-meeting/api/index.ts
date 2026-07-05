/**
 * 선곡 조율 BE API fetcher 모음 — API_SPEC §7.
 *
 * 현재 FE 의 메인 흐름은 Zustand mock(`store/setlistStore.ts`) 을 사용.
 * 이 fetcher 들은 BE 도입 단계에서 store action 을 점진적으로 교체하기 위해 미리 준비된 표면이다.
 */
import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

import type {
  ConfirmSessionRequest,
  CreateChatMessageRequest,
  CreateSelectionItemRequest,
  CreateSelectionMeetingRequest,
  SelectionItemChatMessageResponse,
  SelectionItemResponse,
  SelectionMeetingDetailResponse,
  SelectionMeetingResponse,
  UpdateSelectionItemRequest,
  UpdateSelectionMeetingRequest,
} from '../types/api';

const PREFIX = '/api/v1/setlist-meetings';

// ─── 회의 ─────────────────────────────────────────────────────────────

/** §7-1. */
export function createSelectionMeeting(
  body: CreateSelectionMeetingRequest,
): Promise<SelectionMeetingResponse> {
  return apiClient.post<SelectionMeetingResponse>(PREFIX, body);
}

/** §7-2. */
export function getMySelectionMeetings(params?: {
  lastId?: string;
  pageSize?: number;
}): Promise<CursorResponse<SelectionMeetingResponse, string>> {
  return apiClient.get<CursorResponse<SelectionMeetingResponse, string>>(`${PREFIX}/me`, {
    query: params,
  });
}

/** §7-3. */
export function getSelectionMeeting(meetingId: string): Promise<SelectionMeetingDetailResponse> {
  return apiClient.get<SelectionMeetingDetailResponse>(`${PREFIX}/${meetingId}`);
}

/** §7-4. */
export function updateSelectionMeeting(
  meetingId: string,
  body: UpdateSelectionMeetingRequest,
): Promise<SelectionMeetingResponse> {
  return apiClient.patch<SelectionMeetingResponse>(`${PREFIX}/${meetingId}`, body);
}

/** §7-5. */
export function deleteSelectionMeeting(meetingId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${meetingId}`);
}

// ─── 곡(Item) ─────────────────────────────────────────────────────────

/** §7-6. */
export function getSelectionItems(
  meetingId: string,
  params?: { lastId?: string; pageSize?: number },
): Promise<CursorResponse<SelectionItemResponse, string>> {
  return apiClient.get<CursorResponse<SelectionItemResponse, string>>(
    `${PREFIX}/${meetingId}/items`,
    { query: params },
  );
}

/** §7-7. */
export function getSelectionItem(
  meetingId: string,
  itemId: string,
): Promise<SelectionItemResponse> {
  return apiClient.get<SelectionItemResponse>(`${PREFIX}/${meetingId}/items/${itemId}`);
}

/** §7-8. */
export function createSelectionItem(
  meetingId: string,
  body: CreateSelectionItemRequest,
): Promise<SelectionItemResponse> {
  return apiClient.post<SelectionItemResponse>(`${PREFIX}/${meetingId}/items`, body);
}

/** §7-9. */
export function updateSelectionItem(
  meetingId: string,
  itemId: string,
  body: UpdateSelectionItemRequest,
): Promise<SelectionItemResponse> {
  return apiClient.patch<SelectionItemResponse>(`${PREFIX}/${meetingId}/items/${itemId}`, body);
}

/** §7-10. */
export function deleteSelectionItem(meetingId: string, itemId: string): Promise<void> {
  return apiClient.delete<void>(`${PREFIX}/${meetingId}/items/${itemId}`);
}

// ─── 세션 지원/확정 ──────────────────────────────────────────────────

/** §7-11. */
export function applySession(
  meetingId: string,
  itemId: string,
  sessionId: string,
): Promise<SelectionItemResponse> {
  return apiClient.post<SelectionItemResponse>(
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
): Promise<SelectionItemResponse> {
  return apiClient.patch<SelectionItemResponse>(
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
): Promise<CursorResponse<SelectionItemChatMessageResponse, string>> {
  return apiClient.get<CursorResponse<SelectionItemChatMessageResponse, string>>(
    `${PREFIX}/${meetingId}/items/${itemId}/chat`,
    { query: params },
  );
}

/** §7-15. */
export function postItemChat(
  meetingId: string,
  itemId: string,
  body: CreateChatMessageRequest,
): Promise<SelectionItemChatMessageResponse> {
  return apiClient.post<SelectionItemChatMessageResponse>(
    `${PREFIX}/${meetingId}/items/${itemId}/chat`,
    body,
  );
}

// ─── 잠금/해제 ────────────────────────────────────────────────────────

/** §7-16. */
export function lockSelectionMeeting(meetingId: string): Promise<SelectionMeetingResponse> {
  return apiClient.post<SelectionMeetingResponse>(`${PREFIX}/${meetingId}/lock`, {});
}

/** §7-17. */
export function unlockSelectionMeeting(meetingId: string): Promise<SelectionMeetingResponse> {
  return apiClient.post<SelectionMeetingResponse>(`${PREFIX}/${meetingId}/unlock`, {});
}
