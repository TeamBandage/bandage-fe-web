export interface TrackSelectionResponse {
  selectionId: string;
  title: string;
  bandIds: string[];
  managerId: number;
  practiceWindow: { from: string; to: string };
  createdAt?: string;
  lockedAt?: string;
  updatedAt?: string;
}

export interface ParticipantMemberInfo {
  memberId: number;
  name?: string;
  profileImg?: string;
}

export interface TrackSelectionParticipant {
  /** @deprecated BE가 더 이상 필수로 내려주지 않음. member.memberId 를 사용할 것. */
  memberId?: number;
  bandIds: string[];
  member?: ParticipantMemberInfo;
  isManager: boolean;
}

export interface TrackSelectionDetailResponse extends TrackSelectionResponse {
  participants: TrackSelectionParticipant[];
}

export interface SessionParticipantInfo {
  memberId: number;
  name?: string;
  profileImg?: string;
}

export interface SessionDefResponse {
  applicants: SessionParticipantInfo[];
  confirmed: SessionParticipantInfo[];
  custom: boolean;
  label: string;
  need: number;
  sessionId: string;
  short: string;
}

export interface TrackSelectionItemResponse {
  trackSelectionItemId: string;
  selectionId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  /** @deprecated BE가 더 이상 필수로 내려주지 않음. proposer.memberId 를 사용할 것. */
  proposerId?: number;
  proposer?: SessionParticipantInfo;
  sessions: SessionDefResponse[];
  selected: boolean;
  createdAt?: string;
  updatedAt?: string;
}
