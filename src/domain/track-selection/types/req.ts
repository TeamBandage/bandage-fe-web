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
  sessionId: string;
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
