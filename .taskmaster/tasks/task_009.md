# Task ID: 9

**Title:** 공연(Performance) 도메인 구현

**Status:** pending

**Dependencies:** 8

**Priority:** medium

**Description:** 공연 생성/목록(밴드 필터)/상세 조회/수정/삭제, 공연 합주 추가(신규 생성/기존 연결), 합주 연결 해제 기능을 구현합니다. PerformanceManager 권한 체크를 적용합니다.

**Details:**

1. src/domain/performance/types/req.ts:
```ts
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
```

2. src/domain/performance/types/res.ts:
```ts
export interface CreatePerformanceResponse {
  performanceId: string;
  title: string;
}

export interface PerformanceListResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string;
}

export interface PerformanceDetailResponse {
  performanceId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  venue?: string;
  bandIds: string[];
  managerIds: number[];
  practiceIds: string[];
}

export interface PerformancePracticeResponse {
  performancePracticeId: string;
  practiceId: string;
}
```

3. src/domain/performance/api/:
- createPerformance.ts, listPerformances.ts, getPerformance.ts
- updatePerformance.ts, deletePerformance.ts
- addPerformancePractice.ts, batchAddPerformancePractices.ts, removePerformancePractice.ts

4. src/domain/performance/hooks/:
- useCreatePerformance.ts, usePerformanceList.ts (무한), usePerformanceDetail.ts
- useUpdatePerformance.ts, useDeletePerformance.ts
- useAddPerformancePractice.ts, useBatchAddPerformancePractices.ts, useRemovePerformancePractice.ts

5. src/global/auth/useIsPerformanceManager.ts - 현재 유저가 공연 매니저인지 확인 훅

6. src/domain/performance/components/:
- PerformanceCard.tsx - 목록용
- PerformanceBandChips.tsx - 참여 밴드 칩들
- PerformancePracticeRow.tsx - 연결된 합주 행 + 연결 해제 버튼

7. src/app/(main)/performances/page.tsx:
- 무한 스크롤 목록
- 쿼리스트링 bandId로 필터링 지원
- 생성 FAB

8. src/app/(main)/performances/new/page.tsx + PerformanceCreateForm.client.tsx:
- 제목/밴드 선택(multi-select)/일정/장소 입력

9. src/app/(main)/performances/[performanceId]/page.tsx:
- 공연 정보 표시 + 수정 버튼(매니저만)
- 참여 밴드 칩 목록
- 연결된 합주 목록 + 연결 해제 버튼(매니저만)
- 합주 연결 모달: 기존 합주 선택 또는 신규 합주 생성
- 삭제 버튼(매니저만, 확인 다이얼로그)

**Test Strategy:**

공연 생성 → 기존 합주 3개 연결 → 공연 상세에서 합주 목록 확인 → 합주 연결 해제 → 공연 수정 → 공연 삭제 플로우 수동 테스트
