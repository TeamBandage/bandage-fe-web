export interface CreatePerformanceRequest {
  title: string;
  bandIds?: string[];
  startAt: string;
  durationMinutes: number;
  venue?: string;
}

export interface UpdatePerformanceRequest {
  title?: string;
  startAt?: string;
  durationMinutes?: number;
  venue?: string;
}

export interface AddPerformancePracticeRequest {
  title?: string;
  songId: string;
  startAt: string;
  durationMinutes: number;
  venue?: string;
}

export interface BatchAddPerformancePracticeRequest {
  practiceIds: string[];
}
