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

export interface PerformanceDetailResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string | null;
  bandIds: string[];
  managerIds: number[];
  practiceIds: string[];
}

export interface PerformancePracticeResponse {
  performancePracticeId: string;
  practiceId: string;
}
