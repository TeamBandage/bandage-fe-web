export interface CreatePerformanceResponse {
  performanceId: string;
  title: string;
}

export interface PerformanceListItemResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string | null;
}

/** API_SPEC §6-3 (2026-04-26) — bands/practices 가 평면 ID 배열에서 요약 객체 배열로 확장. */
export interface PerformanceBandSummary {
  bandId: string;
  bandName: string;
}

export interface PerformancePracticeSummary {
  practiceId: string;
  title: string;
  startAt: string;
}

export interface PerformanceDetailResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string | null;
  bands: PerformanceBandSummary[];
  managerIds: number[];
  practices: PerformancePracticeSummary[];
}

export interface PerformancePracticeResponse {
  performancePracticeId: string;
  practiceId: string;
}
