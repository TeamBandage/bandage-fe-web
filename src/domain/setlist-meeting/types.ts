export type SessionDef = {
  id: string;
  label: string;
  short: string;
  need: number;
  /** true 면 곡별 추가 세션(키보드/퍼커션/D2 등). */
  custom?: boolean;
};

export type Applicant = {
  userId: string;
  appliedAt: string;
};

export type Member = {
  id: string;
  name: string;
  /** 멤버의 주 세션(표시용). 실제 지원/확정과는 무관. */
  role: string;
  /** 아바타 색(hex). */
  avatar: string;
  /** 멤버 검색·연락용 이메일 (mock). */
  email?: string;
  /** 외부 프로필 이미지 URL. 없으면 MemberAvatar 가 hex 색 + 이니셜. */
  profileImg?: string;
};

export type Song = {
  id: string;
  meetingId: string;
  title: string;
  artist: string;
  album?: string;
  /** 재생 시간 'mm:ss' 포맷. 미지정 가능. */
  duration?: string;
  proposerId: string;
  note?: string;
  /** 참고 링크(URL). */
  reference?: string;
  sessions: SessionDef[];
  /** sessionId → userId[]. */
  applicants: Record<string, string[]>;
  /** sessionId → userId[]. confirmed.length >= need 면 full. */
  confirmed: Record<string, string[]>;
  /** 매니저가 최종 선곡으로 확정한 항목. */
  isSelected?: boolean;
};

export type MeetingPurpose = 'performance' | 'general';

export type Meeting = {
  id: string;
  bandId: string;
  bandName: string;
  title: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  /** 매니저가 선곡을 확정한 시각(ISO). null/undefined 면 진행 중. */
  lockedAt?: string | null;
  /** 회의 목적 — 공연 셋리스트 / 일반 합주곡 벌크. */
  purpose?: MeetingPurpose;
  /** purpose='performance' 일 때 연결된 공연. */
  performanceId?: string | null;
  /** 회의 참여 멤버 userId 목록. */
  participantUserIds?: string[];
  /** 매니저 확정 시 BE 매핑 — 회의 곡 id → 합주곡 id. */
  practiceSongMap?: Record<string, string>;
  /** 직전 잠금 시점의 곡 스냅샷(재확정 시 변경분 diff 계산용). 단순화: songId 집합. */
  lockSnapshotSongIds?: string[];
  /** 합주 가능 기간. mvp: 'YYYY-MM-DD'. 공연 모드는 오늘~공연일자 자동, 일반 모드는 사용자 입력. */
  practiceWindow?: { from: string; to: string };
  /** 매니저가 확정한 합주 슬롯. */
  confirmedSlot?: { date: string; startMin: number; endMin: number } | null;
};

export type SessionState = 'full' | 'partial' | 'empty';
