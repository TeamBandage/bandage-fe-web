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

## Subtasks

### 9.1. 공연 도메인 타입 정의 및 API 함수 구현

**Status:** pending  
**Dependencies:** None  

공연(Performance) 도메인의 요청/응답 DTO 타입을 정의하고, 모든 API 함수(생성, 목록, 상세, 수정, 삭제, 합주 추가/배치추가/제거)를 구현합니다.

**Details:**

1. src/domain/performance/types/req.ts 생성:
   - CreatePerformanceRequest: { title: string; bandIds?: string[]; startAt: string; durationMinutes: number; venue?: string }
   - UpdatePerformanceRequest: { title?: string; startAt?: string; durationMinutes?: number; venue?: string }
   - AddPerformancePracticeRequest: { title?: string; songId: string; startAt: string; durationMinutes: number; venue?: string }
   - BatchAddPerformancePracticeRequest: { practiceIds: string[] }

2. src/domain/performance/types/res.ts 생성:
   - CreatePerformanceResponse: { performanceId: string; title: string }
   - PerformanceListResponse: { performanceId: string; title: string; startAt: string; durationMinutes: number; venue?: string }
   - PerformanceDetailResponse: { performanceId: string; title: string; startAt: string; durationMinutes: number; venue?: string; bandIds: string[]; managerIds: number[]; practiceIds: string[] }
   - PerformancePracticeResponse: { performancePracticeId: string; practiceId: string }

3. src/domain/performance/api/ 디렉토리에 API 함수들 구현:
   - createPerformance.ts: POST /api/v1/performances
   - getPerformanceList.ts: GET /api/v1/performances (커서 페이징, bandId 쿼리 파라미터)
   - getPerformanceDetail.ts: GET /api/v1/performances/{performanceId}
   - updatePerformance.ts: PATCH /api/v1/performances/{performanceId}
   - deletePerformance.ts: DELETE /api/v1/performances/{performanceId}
   - addPerformancePractice.ts: POST /api/v1/performances/{performanceId}/practices
   - batchAddPerformancePractices.ts: POST /api/v1/performances/{performanceId}/practices/batch
   - removePerformancePractice.ts: DELETE /api/v1/performances/{performanceId}/practices/{practiceId}

기존 apiClient (src/global/api/apiClient.ts) 패턴을 따르며, CursorResponse<T, C> 타입 활용

### 9.2. 공연 도메인 TanStack Query 훅 및 권한 체크 훅 구현

**Status:** pending  
**Dependencies:** 9.1  

공연 API를 래핑하는 TanStack Query 훅들과 공연 매니저 권한 체크 훅(useIsPerformanceManager)을 구현합니다.

**Details:**

1. src/domain/performance/hooks/ 디렉토리 생성 및 훅 구현:
   - useCreatePerformance.ts: useMutation 활용, 성공 시 목록 캐시 무효화, useToast로 피드백
   - usePerformanceList.ts: useInfiniteCursor 활용 (queryKeys.performance.list 사용), bandId 필터 옵션 지원
   - usePerformanceDetail.ts: useQuery 활용 (queryKeys.performance.detail 사용)
   - useUpdatePerformance.ts: useMutation, 성공 시 상세 캐시 무효화
   - useDeletePerformance.ts: useMutation, 확인 후 목록 캐시 무효화
   - useAddPerformancePractice.ts: useMutation, 상세 캐시 무효화
   - useBatchAddPerformancePractices.ts: useMutation, 상세 캐시 무효화
   - useRemovePerformancePractice.ts: useMutation, 낙관적 업데이트 적용
   - index.ts: 모든 훅 re-export

2. src/global/auth/useIsPerformanceManager.ts 생성:
   - performanceId를 받아 현재 유저가 해당 공연의 매니저인지 확인
   - PerformanceDetailResponse의 managerIds와 현재 유저 ID 비교
   - 로딩/에러 상태 포함한 { isManager: boolean; isLoading: boolean } 반환

기존 useInfiniteCursor (src/hooks/useInfiniteCursor.ts) 및 queryKeys (src/global/config/queryKeys.ts) 패턴 준수

### 9.3. 공연 UI 컴포넌트(PerformanceCard, BandChips, PracticeRow) 구현

**Status:** pending  
**Dependencies:** 9.1  

공연 목록용 카드 컴포넌트, 참여 밴드 칩 목록, 연결된 합주 행 컴포넌트를 구현합니다.

**Details:**

1. src/domain/performance/components/PerformanceCard.tsx:
   - PerformanceListResponse 타입 props
   - Card 컴포넌트(src/components/ui/card.tsx) 활용, interactive: true
   - 제목, 일정(formatKst 사용), 장소 표시
   - D-day 뱃지 (7일 이내: danger, 14일 이내: amber)
   - 클릭 시 상세 페이지 이동 (ROUTES.PERFORMANCE_DETAIL 사용)

2. src/domain/performance/components/PerformanceBandChips.tsx:
   - bandIds: string[] props
   - Chip 컴포넌트(src/components/ui/chip.tsx) 활용
   - 각 밴드명 표시 (밴드 정보 조회 필요 시 별도 로직)

3. src/domain/performance/components/PerformancePracticeRow.tsx:
   - practiceId, performanceId props
   - 연결된 합주 정보 표시 (제목, 곡명 등)
   - 연결 해제 버튼 (매니저만 표시, useIsPerformanceManager 활용)
   - 클릭 시 합주 상세로 이동 옵션

4. src/domain/performance/components/index.ts: 모든 컴포넌트 re-export

기존 Card, Chip, Badge 컴포넌트 스타일 및 formatKst (src/lib/date.ts) 활용

### 9.4. 공연 목록 및 생성 페이지 구현

**Status:** pending  
**Dependencies:** 9.2, 9.3  

공연 목록 페이지(/performances)와 공연 생성 페이지(/performances/new)를 구현합니다.

**Details:**

1. src/app/(main)/performances/page.tsx 수정:
   - 서버 컴포넌트로 유지, 클라이언트 컴포넌트 분리
   - PageTitle + 생성 FAB 버튼 (ROUTES.PERFORMANCE_NEW 링크)
   - 쿼리스트링 bandId로 필터링 지원 (useSearchParams)

2. src/app/(main)/performances/PerformanceList.client.tsx 생성:
   - 'use client' 선언
   - usePerformanceList 훅으로 무한 스크롤 목록
   - PerformanceCard 컴포넌트로 각 항목 렌더링
   - EmptyState (공연 없음), Skeleton (로딩) 처리
   - 하단 스크롤 감지하여 fetchNextPage 호출

3. src/app/(main)/performances/new/page.tsx 생성:
   - 서버 컴포넌트, PageTitle '공연 생성'

4. src/app/(main)/performances/new/PerformanceCreateForm.client.tsx 생성:
   - 'use client' 선언
   - react-hook-form + zod 스키마로 폼 검증
   - 필드: 제목(필수), 밴드 선택(multi-select), 일시(datetime-local), 소요 시간, 장소
   - useCreatePerformance 훅으로 생성 요청
   - 성공 시 ROUTES.PERFORMANCES로 리다이렉트 + 토스트

기존 Field (src/components/ui/field.tsx), Button, Dialog 컴포넌트 활용

### 9.5. 공연 상세 페이지(조회/수정/삭제/합주 연결) 구현

**Status:** pending  
**Dependencies:** 9.2, 9.3  

공연 상세 페이지에서 정보 조회, 수정, 삭제, 합주 연결/해제 기능을 구현합니다.

**Details:**

1. src/app/(main)/performances/[performanceId]/page.tsx 생성:
   - 서버 컴포넌트, params에서 performanceId 추출
   - Suspense 경계로 클라이언트 컴포넌트 래핑

2. src/app/(main)/performances/[performanceId]/PerformanceDetail.client.tsx:
   - 'use client' 선언
   - usePerformanceDetail 훅으로 데이터 조회
   - 공연 정보 표시: 제목, 일정, 장소, 소요 시간
   - PerformanceBandChips로 참여 밴드 목록 표시
   - 매니저 목록 Avatar + 이름 표시
   - 연결된 합주 목록 (PerformancePracticeRow)
   - 수정/삭제 버튼 (useIsPerformanceManager로 권한 체크)

3. 수정 모달/바텀시트 구현:
   - Dialog 또는 BottomSheet 활용
   - useUpdatePerformance 훅으로 업데이트
   - 성공 시 토스트 + 캐시 갱신

4. 삭제 기능:
   - useConfirmDialog로 확인 다이얼로그
   - useDeletePerformance 훅으로 삭제
   - 성공 시 ROUTES.PERFORMANCES로 리다이렉트 + 토스트

5. 합주 연결 모달:
   - Dialog로 모달 구현
   - 탭 2개: '기존 합주 선택' / '새 합주 생성'
   - 기존 합주 선택: 체크박스 리스트 + useBatchAddPerformancePractices
   - 새 합주 생성: AddPerformancePracticeRequest 폼 + useAddPerformancePractice

기존 Dialog, BottomSheet, useConfirmDialog, useToast 활용
