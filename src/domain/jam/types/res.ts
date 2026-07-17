export interface TrackInfoResponse {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  reference?: string;
}

export interface JamSessionParticipantInfo {
  memberId: number;
  name: string;
  profileImg?: string;
}

export interface JamMemberInfo {
  memberId: number;
  name?: string;
  profileImg?: string;
}

export interface JamSessionResponse {
  sessionId: string;
  label: string;
  short: string;
  custom: boolean;
  participants: JamSessionParticipantInfo[];
}

export interface JamParticipantResponse {
  participantId: string;
  member?: JamMemberInfo;
  sessionIds: string[];
}

export interface JamDetailResponse {
  jamId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  track: TrackInfoResponse;
  venue?: string | null;
  note?: string | null;
  sessions: JamSessionResponse[];
  participants: JamParticipantResponse[];
  setlistId?: string | null;
}

export interface JamListItemResponse {
  jamId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string | null;
}

export interface JamResponse {
  jamId: string;
  jamTitle: string;
}

export type AddParticipantResponse = JamParticipantResponse;
