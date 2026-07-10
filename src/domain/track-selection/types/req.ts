export interface CreateTrackSelectionRequest {
  title: string;
  /** 밴드 선택은 선택 사항 — 밴드 없이 멤버만으로 회의를 만들면 빈 배열로 전송. */
  bandIds: string[];
  managerId: number;
  participantUserIds: number[];
  /** purpose=GENERAL(현재 생성 플로우에서 유일하게 만들 수 있는 종류)인 회의는 BE에서 필수. */
  practiceWindow: {
    from: string;
    to: string;
  };
}

export interface UpdateTrackSelectionRequest {
  title: string;
}

export interface SessionDefDto {
  custom: boolean;
  label: string;
  sessionId: string;
  short: string;
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
