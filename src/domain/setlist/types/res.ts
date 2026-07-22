import type { ScheduleBoardConstraints } from './req';

export interface SetlistResponse {
  setlistId: string;
  title: string;
  trackSelectionId: string;
  managerId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetlistTrackSessionParticipant {
  memberId: number;
  name: string;
  profileImg?: string;
}

export interface SetlistTrackSessionResponse {
  sessionId: string;
  label: string;
  short: string;
  need?: number;
  custom: boolean;
  participants: SetlistTrackSessionParticipant[];
}

export interface SetlistTrackResponse {
  setlistTrackId: string;
  setlistId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions: SetlistTrackSessionResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurrenceResponse {
  freq: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY';
  interval: number;
  count?: number;
  until?: string;
}

export interface ScheduleBlockResponse {
  blockId: string;
  trackIds: string[];
  startDate: string;
  startSlot: number;
  endDate: string;
  endSlot: number;
  pinned: boolean;
  title?: string;
  note?: string;
  recurrence: RecurrenceResponse;
  placementOrigin: 'MANUAL' | 'AUTO' | 'ANCHORED';
}

export interface ScheduleBoardResponse {
  boardId: string;
  setlistId: string;
  name: string;
  confirmed: boolean;
  constraints: ScheduleBoardConstraints;
  windowFrom?: string;
  windowTo?: string;
  blocks: ScheduleBlockResponse[];
  createdAt: string;
}
