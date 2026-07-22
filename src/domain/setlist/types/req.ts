export interface SetlistCreateRequest {
  trackSelectionId: string;
  title?: string;
}

export interface SetlistUpdateRequest {
  title: string;
}

export interface SetlistTrackUpdateRequest {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  note?: string;
  reference?: string;
  sessions?: {
    sessionId: string;
    label: string;
    short: string;
    need: number;
    custom: boolean;
  }[];
}

export interface SetlistToJamRequest {
  startAt: string;
  durationMinutes: number;
  venue?: string;
}

export interface ScheduleBoardConstraints {
  excludeLateNight: boolean;
  maxConsecutiveMinutes: number;
  workingHoursStart: number;
  workingHoursEnd: number;
}

export interface ScheduleBoardCreateRequest {
  name: string;
  constraints?: Partial<ScheduleBoardConstraints>;
  windowFrom?: string;
  windowTo?: string;
}

export type ScheduleBoardUpdateRequest = Partial<ScheduleBoardCreateRequest>;

export interface ScheduleBlockRecurrenceRequest {
  freq: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY';
  interval: number;
  until?: string;
  count?: number;
}

export interface ScheduleBlockUpsertRequest {
  trackIds: string[];
  startDate: string;
  startSlot: number;
  endDate: string;
  endSlot: number;
  pinned?: boolean;
  title?: string;
  note?: string;
  recurrence?: ScheduleBlockRecurrenceRequest;
}
