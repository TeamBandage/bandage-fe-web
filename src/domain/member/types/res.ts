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
  contact: string;
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
