export interface CreatePerformanceRequest {
  title: string;
  bandIds?: string[];
  setlistIds?: string[];
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

export interface PerformanceSetlistAddRequest {
  setlistIds: string[];
}

export interface PerformanceInvitationCreateRequest {
  memberId: number;
}
