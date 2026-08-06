export interface TrackInfoRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  reference?: string;
}

export interface SessionDefDto {
  sessionId: string;
  /** 영문 대문자만 허용(BE 검증 패턴 ^[A-Za-z]+$, FE는 대문자로 정규화해 전송). */
  label: string;
  custom: boolean;
}

export interface UpdateSessionRequest {
  label?: string;
}

export interface JamSessionsUpdateRequest {
  sessions: SessionDefDto[];
}

export interface CreateJamRequest {
  title?: string;
  track: TrackInfoRequest;
  venue?: string;
  startAt: string;
  durationMinutes: number;
  sessions: SessionDefDto[];
  note?: string;
}

export interface UpdateTimeInfoRequest {
  startAt: string;
  durationMinutes: number;
}

export interface UpdateVenueRequest {
  venue: string;
}

export interface AddParticipantRequest {
  memberId: number;
  sessionId: string;
}
