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

/** API_SPEC §3-3-1 — `/bands/me` 응답 항목. 본인의 밴드 내 역할(myRole) 포함. */
export interface MyBandInfoResponse extends BandInfoResponse {
  myRole: BandRole;
}

export interface BandMemberInfoResponse {
  bandMemberId: string;
  memberId: number;
  role: BandRole;
  /** 백엔드 미지원 시 undefined. API_REQUIRED.md FE-API-012 참조. */
  name?: string;
  /** 동일 사유 — API 추가 시 자동 반영. */
  profileImg?: string;
}

export interface BandApplicationInfoResponse {
  bandApplicationId: string;
  memberId: number;
  status: ApplicationStatus;
  /** 백엔드 미지원 시 undefined. API_REQUIRED.md FE-API-013 참조. */
  applicantName?: string;
  applicantProfileImg?: string;
  /** 신청 일시. 동일 사유. */
  appliedAt?: string;
}
