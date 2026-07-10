export interface CreateTrackSelectionRequest {
  title: string;
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
