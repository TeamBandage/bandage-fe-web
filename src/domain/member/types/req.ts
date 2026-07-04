export interface JoinRequest {
  email: string;
  password: string;
  name: string;
}

export interface UpdateMeRequest {
  name?: string;
  /** presigned URL 업로드 후 받은 objectKey 또는 그대로의 CloudFront URL. */
  profileImg?: string;
}

export interface WeeklyRuleRequest {
  dayOfWeek: import('./res').DayOfWeek;
  startSlot: number;
  endSlot: number;
}

export interface AvailabilityExceptionRequest {
  date: string;
  kind: import('./res').AvailabilityKind;
  startSlot?: number | null;
  endSlot?: number | null;
}

/** API_SPEC §2-8 — 가용성 등록/수정. weeklyRules·exceptions 전체 교체 방식. effectiveTo는 필수. */
export interface UpdateMyAvailabilityRequest {
  weeklyRules: WeeklyRuleRequest[];
  exceptions: AvailabilityExceptionRequest[];
  note?: string | null;
  effectiveFrom: string;
  effectiveTo: string;
}
