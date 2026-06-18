export interface JoinResponse {
  id: number;
  email: string;
}

export interface MemberInfoResponse {
  /** API_SPEC §2-2: `id` 는 `memberId` 의 프론트 호환 alias. */
  id: number;
  memberId?: number;
  email: string;
  name: string;
  /** 프로필 이미지 URL. 미설정 시 null. */
  profileImg?: string | null;
  createdAt?: string;
}

/** API_SPEC §2-5 — 홈 화면 통계 카드. */
export interface MemberMetricsResponse {
  bandCount: number;
  upcomingPracticeCount: number;
  upcomingPerformanceCount: number;
  sessionCount: number;
}

/** API_SPEC §2-6 — 회원 검색 결과 단건. */
export interface MemberSearchItemResponse {
  memberId: number;
  name: string;
  email: string;
  profileImg?: string | null;
}

export type AvailabilityKind = 'AVAILABLE' | 'BLOCKED';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** API_SPEC §2-7 — 주간 반복 가용 규칙. slot 0=00:00, slot 18=09:00, 30분 단위, [startSlot, endSlot) */
export interface WeeklyRuleResponse {
  dayOfWeek: DayOfWeek;
  startSlot: number;
  endSlot: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/** API_SPEC §2-7 — 날짜별 예외. startSlot/endSlot null이면 전일 적용. */
export interface AvailabilityExceptionResponse {
  date: string;
  kind: AvailabilityKind;
  startSlot: number | null;
  endSlot: number | null;
}

/** API_SPEC §2-7 — 내 가용성 응답. 미등록 시 weeklyRules/exceptions 빈 배열, updatedAt null. */
export interface MemberAvailabilityResponse {
  memberId: number;
  weeklyRules: WeeklyRuleResponse[];
  exceptions: AvailabilityExceptionResponse[];
  note: string | null;
  updatedAt: string | null;
}
