import type { SessionType } from '@/global/types';

export interface CreatePracticeResponse {
  practiceId: string;
  practiceTitle: string;
}

export interface PracticeSongResponse {
  songId: string;
  title: string;
  artist: string;
  refLink?: string | null;
}

export interface PracticeParticipantResponse {
  participantId: string;
  memberId: number;
  /** 백엔드 미지원 시 undefined. API_REQUIRED.md FE-API-014 참조. */
  name?: string;
}

export interface PracticeSessionResponse {
  sessionId: string;
  label: string;
  type: SessionType;
  participant: PracticeParticipantResponse | null;
}

export interface PracticeDetailResponse {
  practiceId: string;
  title: string;
  venue?: string | null;
  startAt: string;
  durationMinutes: number;
  song: PracticeSongResponse;
  sessions: PracticeSessionResponse[];
  participants: PracticeParticipantResponse[];
}

export interface PracticeListItemResponse {
  practiceId: string;
  title: string;
  venue?: string | null;
  startAt: string;
  durationMinutes: number;
  song?: PracticeSongResponse | null;
}

export type CreateSessionResponse = PracticeSessionResponse;

export type AddParticipantResponse = PracticeParticipantResponse;
