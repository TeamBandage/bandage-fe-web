import type {
  SetlistParticipantResponse,
  SetlistResponse,
  SetlistTrackResponse,
} from '@/domain/setlist/types/res';

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
  ownerId: number;
  managerIds: number[];
  setlists: PerformanceSetlistSummary[];
}

export interface PerformanceSetlistResponse {
  performanceSetlistId: string;
  setlistId: string;
}

export interface PerformanceSetlistTracksResponse {
  setlist: SetlistResponse;
  tracks: SetlistTrackResponse[];
  /** 해당 셋리스트 기준 참여자(매니저 + 트랙 배정자). 공연에 묶였다는 이유로 확장되지 않음. */
  participants: SetlistParticipantResponse[];
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
