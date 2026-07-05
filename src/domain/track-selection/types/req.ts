export interface CreateTrackSelectionRequest {
  title: string;
  bandIds: string[];
  managerId: number;
  participantUserIds: number[];
  practiceWindow?: {
    from: string;
    to: string;
  };
}

export interface SessionDefDto {
  custom: boolean;
  label: string;
  need: number;
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
