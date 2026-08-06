export interface TrackInfoRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  reference?: string;
}

export interface SessionDefDto {
  /**
   * BD-269: 서버가 발급. 신규 세션은 생략(서버가 새로 생성), 기존 세션 유지/수정은
   * 응답에서 받은 값을 그대로 재전송. 임의 값 전송 시 400(SESSION_NOT_FOUND/SESSION_DUPLICATED).
   */
  sessionId?: string;
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
