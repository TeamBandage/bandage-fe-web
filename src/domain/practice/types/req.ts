import type { SessionType } from '@/global/types';

export interface CreatePracticeRequest {
  title?: string;
  song: string;
  venue?: string;
  startAt: string;
  durationMinutes: number;
}

export interface UpdateScheduleRequest {
  startAt: string;
  durationMinutes: number;
}

export interface UpdateVenueRequest {
  venue: string;
}

export interface CreateSessionRequest {
  label: string;
  type: SessionType;
}

export interface AddParticipantRequest {
  memberId: number;
}
