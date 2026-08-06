export interface CreateTrackSelectionRequest {
  title: string;
  /** 밴드 선택은 선택 사항 — 밴드 없이 멤버만으로 회의를 만들면 빈 배열로 전송. */
  bandIds: string[];
  managerId: number;
  participantUserIds: number[];
}

export interface UpdateTrackSelectionRequest {
  title: string;
}

export interface SessionDefDto {
  custom: boolean;
  /** 영문 대문자만 허용(BE 검증 패턴 ^[A-Za-z]+$, FE는 대문자로 정규화해 전송). */
  label: string;
  /**
   * BD-269: 서버가 발급. 신규 세션은 생략(서버가 새로 생성), 기존 세션 유지/수정은
   * 응답에서 받은 값을 그대로 재전송. 임의 값 전송 시 400(SESSION_NOT_FOUND/SESSION_DUPLICATED).
   */
  sessionId?: string;
}

export interface TrackSelectionItemCreateRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions: SessionDefDto[];
}

export interface TrackSelectionItemUpdateRequest {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions?: SessionDefDto[];
}

export type TrackSelectionItemStatus = 'OPEN' | 'APPLY_COMPLETED' | 'ASSIGN_COMPLETED' | 'CLOSED';
export type TrackSelectionSearchField = 'TITLE' | 'ARTIST' | 'ALBUM';

/**
 * 선곡 항목 목록 조회 필터. 4개 필터는 서로 독립적으로 AND 결합된다.
 * status 값끼리는 겹칠 수 있음(예: ASSIGN_COMPLETED 항목은 APPLY_COMPLETED 조건도 만족) — 소비 측에서 주의.
 */
export interface TrackSelectionItemsFilter {
  status?: TrackSelectionItemStatus[];
  appliedByMe?: boolean;
  memberName?: string;
  keyword?: string;
  searchFields?: TrackSelectionSearchField[];
}
