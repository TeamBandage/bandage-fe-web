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
