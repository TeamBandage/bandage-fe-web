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

export interface ScheduleBoardCreateRequest {
  name: string;
  /** 근무 시작 슬롯(0~47, 30분 단위) — 서버 필수 필드. UI 노출 없이 항상 0(하루 전체)으로 전송. */
  boardTimeRangeFrom: number;
  /** 근무 종료 슬롯(1~48, 반열린 구간 — 24:00 은 48) — 서버 필수 필드. UI 노출 없이 항상 48로 전송. */
  boardTimeRangeTo: number;
  windowFrom?: string;
  windowTo?: string;
}

export type ScheduleBoardUpdateRequest = Partial<ScheduleBoardCreateRequest>;

export interface ScheduleBlockUpsertRequest {
  trackIds: string[];
  startDate: string;
  startSlot: number;
  /** 반열린 구간 [startSlot, endSlot) — 24:00 종료는 48. */
  endDate: string;
  endSlot: number;
  pinned?: boolean;
  title?: string;
  note?: string;
}

export type ScheduleAutoScheduleInterval = 'ONCE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type ScheduleAutoScheduleDayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** 필드 전부 옵셔널 — 백엔드 스펙상 바디 자체는 필수지만 개별 필드는 전부 옵셔널이라, 마법사가
 * 기간이 짧아 질문을 건너뛴 필드는 아예 보내지 않고 백엔드 기본값에 맡길 수 있다. */
export interface ScheduleAutoScheduleRequest {
  interval?: ScheduleAutoScheduleInterval;
  jamDurationSlots?: number;
  maxJamsPerDay?: number;
  maxEmptySlotsBetweenJams?: number;
  dayPreference?: ScheduleAutoScheduleDayOfWeek[];
  startTimePreference?: number;
  endTimePreference?: number;
}
