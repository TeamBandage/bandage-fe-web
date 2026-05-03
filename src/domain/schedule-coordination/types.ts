/**
 * 합주 일정 조율 도메인 — 멤버별 가용 시간 수집/종합/매니저 확정.
 */

/** 30분 슬롯 비트마스크. 0=00:00 ~ 47=23:30. */
export type SlotMask = boolean[]; // length 48

export interface MemberSchedule {
  meetingId: string;
  userId: string;
  /** 사용자가 '가능' 으로 표시한 일자 'YYYY-MM-DD' 목록. */
  availableDates: string[];
  /** 명시적으로 '불가능' 으로 표시한 일자. (default: 미표시 = 미선택) */
  unavailableDates: string[];
  /** 일자별 시간 블록 — date → 48슬롯 boolean[]. */
  blocks: Record<string, SlotMask>;
  /** 특이사항 메모. */
  note: string;
  /** 마법사 완료 시 true. 부분 입력 상태도 저장은 됨. */
  completed: boolean;
  /** 마지막 업데이트 ISO. */
  updatedAt: string;
}

export interface AggregateSlot {
  date: string;
  startMin: number;
  endMin: number;
  /** 이 슬롯에 가능한 멤버 userId 목록. */
  availableUserIds: string[];
}

/** Task 4 — 매니저가 만드는 합주 시간표 시안. 한 회의당 최대 5개. */
export interface ScheduleBoard {
  boardId: string;
  meetingId: string;
  name: string;
  blocks: ScheduleBlock[];
  /** 잠금된 blockId 목록 — Task 13 자동 재배치 시 이동 금지. */
  pinned: string[];
  /** 컬러 팔레트 시드 — 자동 생성 안마다 다른 톤. */
  paletteSeed: number;
  confirmed: boolean;
  /** Task 13 — Working Hours / 심야 배제 등 제약. 미설정 시 DEFAULT_BOARD_CONSTRAINTS. */
  constraints?: ScheduleBoardConstraints;
  createdAt: string;
  updatedAt: string;
}

/** Task 13 — 시간표 제약 조건. board 단위로 저장. */
export interface ScheduleBoardConstraints {
  /** Working Hours 시작 슬롯 (0~47). default 18 = 09:00. */
  workingHoursStart: number;
  /** Working Hours 끝 슬롯 (0~48). default 44 = 22:00. */
  workingHoursEnd: number;
  /** 심야 배제 토글 — true 면 24:00 이후 배치 금지. */
  excludeLateNight: boolean;
  /** 최대 연속 합주 분(min). 초과 시 자동 휴식. default 240(4시간). */
  maxConsecutiveMinutes: number;
}

export const DEFAULT_BOARD_CONSTRAINTS: ScheduleBoardConstraints = {
  workingHoursStart: 18,
  workingHoursEnd: 44,
  excludeLateNight: true,
  maxConsecutiveMinutes: 240,
};

/** 시간표 안에 배치되는 합주 블록. blockId 는 board 내 unique. */
export interface ScheduleBlock {
  blockId: string;
  songId: string;
  date: string; // YYYY-MM-DD
  startSlot: number; // 0~47
  durationSlots: number;
  songTitleOverride?: string;
  note?: string;
  pinned: boolean;
  paletteIndex: number;
}
