import type { ApplicationStatus, BandRole } from '@/global/types';

export interface CreateBandResponse {
  bandId: string;
  bandName: string;
}

export interface BandInfoResponse {
  bandId: string;
  bandName: string;
  description?: string;
  profileImg?: string;
}

export interface BandMemberInfoResponse {
  bandMemberId: string;
  memberId: number;
  role: BandRole;
}

export interface BandApplicationInfoResponse {
  bandApplicationId: string;
  memberId: number;
  status: ApplicationStatus;
}
