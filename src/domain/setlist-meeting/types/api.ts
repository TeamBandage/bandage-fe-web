/**
 * BE API_SPEC §7 와 1:1 대응되는 타입.
 * FE 내부 mock 도메인(types.ts) 과 별도로 둠 — 향후 mock → real fetcher 교체 시 이 타입을 그대로 store 에 채워넣기 위한 표면.
 */

export type ApiMeetingPurpose = 'PERFORMANCE' | 'GENERAL';

/** §7-1 / §7-3 응답. */
export interface SelectionMeetingResponse {
  meetingId: string;
  bandId: string;
  title: string;
  purpose: ApiMeetingPurpose;
  performanceId: string | null;
  managerId: number;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** §7-3 단건 조회 응답 — 참여자 포함. */
export interface SelectionMeetingDetailResponse extends SelectionMeetingResponse {
  participantUserIds: number[];
}

/** §7 곡(Item) 의 세션 정의 + 지원/확정 임베디드. */
export interface SelectionItemSessionResponse {
  sessionId: string;
  label: string;
  short: string;
  need: number;
  custom: boolean;
  applicants: number[];
  confirmed: number[];
}

/** §7-7 / §7-8 / §7-9 응답. */
export interface SelectionItemResponse {
  setlistItemId: string;
  meetingId: string;
  title: string;
  artist: string;
  album: string | null;
  duration: string | null;
  proposerId: number;
  note: string | null;
  /** 매니저 잠금 시 매핑되는 합주곡 ID. */
  practiceSongId: string | null;
  sessions: SelectionItemSessionResponse[];
  createdAt: string;
  updatedAt: string;
}

/** §7-14 채팅 메시지 응답. (실서버 검증 결과 BE 는 `memberId` 필드명 사용 — spec 와 다름) */
export interface SelectionItemChatMessageResponse {
  messageId: string;
  setlistItemId: string;
  /** 작성자 회원 ID. spec 표기는 userId 였으나 실제 응답은 memberId. */
  memberId: number;
  message: string;
  createdAt: string;
}

// ─── Request 바디 타입 ───────────────────────────────────────────────────

export interface CreateSelectionMeetingRequest {
  title: string;
  purpose: ApiMeetingPurpose;
  performanceId?: string | null;
  bandId: string;
  managerId: number;
  participantUserIds: number[];
}

export interface UpdateSelectionMeetingRequest {
  title?: string;
  managerId?: number;
}

export interface SelectionItemSessionDefRequest {
  sessionId: string;
  label: string;
  short: string;
  need: number;
  custom?: boolean;
}

export interface CreateSelectionItemRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  note?: string;
  sessions: SelectionItemSessionDefRequest[];
}

export interface UpdateSelectionItemRequest {
  title?: string;
  artist?: string;
  album?: string;
  duration?: string;
  note?: string;
  sessions?: SelectionItemSessionDefRequest[];
}

export interface ConfirmSessionRequest {
  /** 새로 확정할 사용자 ID 목록. BE 가 NotNull 검증 — 비어있어도 빈 배열 전달 필요. */
  confirm: number[];
  /** 확정 해제할 사용자 ID 목록. BE 가 NotNull — 빈 배열 전달 필요. */
  unconfirm: number[];
}

export interface CreateChatMessageRequest {
  message: string;
}
