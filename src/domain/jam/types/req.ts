export interface TrackInfoRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  reference?: string;
}

export interface SessionDefDto {
  sessionId: string;
  label: string;
  short: string;
  need: number;
  custom: boolean;
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

export interface UpdateSessionsRequest {
  sessions: SessionDefDto[];
}

export interface AddParticipantRequest {
  memberId: number;
  sessionId: string;
}

export interface UpdateParticipantSessionRequest {
  sessionId: string;
}
