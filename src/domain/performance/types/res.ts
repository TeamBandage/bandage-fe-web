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

export interface PerformanceBandSummary {
  bandId: string;
  bandName: string;
}

export interface PerformanceSetlistSummary {
  setlistId: string;
  title: string;
  bands: PerformanceBandSummary[];
}

export interface PerformanceDetailResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string | null;
  managerIds: number[];
  setlists: PerformanceSetlistSummary[];
}

export interface PerformanceSetlistResponse {
  performanceSetlistId: string;
  setlistId: string;
}

export type PerformanceInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface PerformanceInvitationResponse {
  invitationId: string;
  performanceId: string;
  performanceTitle: string;
  invitedMemberId: number;
  invitedMemberName?: string;
  invitedMemberProfileImg?: string;
  status: PerformanceInvitationStatus;
  createdAt: string;
}
