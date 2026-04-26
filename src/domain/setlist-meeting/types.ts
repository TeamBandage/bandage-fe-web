/**
 * 선곡 회의 (Setlist Meeting) — FE-only mock 도메인.
 * 백엔드 미구현 단계: Zustand persist(sessionStorage)로만 상태 보관.
 * design/web/setlist_web.jsx 의 데이터 모델과 1:1 대응.
 */

export type SessionDef = {
  id: string;
  label: string;
  short: string;
  need: number;
  /** true 면 곡별 추가 세션(키보드/퍼커션/D2 등). 표/우측 패널에서 `*` 표기. */
  custom?: boolean;
};

export type Applicant = {
  userId: string;
  appliedAt: string;
};

export type ChatMessage = {
  userId: string;
  /** 'MM-DD HH:mm' 또는 ISO. mock 은 design 원본 표기 유지. */
  at: string;
  msg: string;
};

export type Member = {
  id: string;
  name: string;
  /** 멤버의 주 세션(표시용). 실제 지원/확정과는 무관. */
  role: string;
  /** 아바타 색(hex). */
  avatar: string;
};

export type Song = {
  id: string;
  meetingId: string;
  title: string;
  artist: string;
  album?: string;
  proposerId: string;
  note?: string;
  sessions: SessionDef[];
  /** sessionId → userId[]. */
  applicants: Record<string, string[]>;
  /** sessionId → userId[]. confirmed.length >= need 면 full. */
  confirmed: Record<string, string[]>;
  chat: ChatMessage[];
};

export type Meeting = {
  id: string;
  bandId: string;
  bandName: string;
  title: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionState = 'full' | 'partial' | 'empty';
