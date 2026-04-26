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
