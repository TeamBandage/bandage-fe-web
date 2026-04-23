# Task ID: 10

**Title:** 홈 대시보드 및 최종 마무리

**Status:** pending

**Dependencies:** 9

**Priority:** medium

**Description:** 홈 대시보드(/home)에 가까운 합주, 내 밴드, 예정 공연 요약을 표시합니다. 전체 화면의 Skeleton/EmptyState/ErrorState 적용을 감사하고, 접근성 및 E2E 테스트를 확장합니다.

**Details:**

1. src/app/(main)/home/page.tsx:
```tsx
import { Suspense } from 'react';
import { UpcomingPractices } from '@/domain/practice/components/UpcomingPractices';
import { MyBands } from '@/domain/band/components/MyBands';
import { UpcomingPerformances } from '@/domain/performance/components/UpcomingPerformances';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  return (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="text-lg font-semibold mb-3">가까운 합주</h2>
        <Suspense fallback={<Skeleton className="h-32" />}>
          <UpcomingPractices limit={3} />
        </Suspense>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">내 밴드</h2>
        <Suspense fallback={<Skeleton className="h-24" />}>
          <MyBands />
        </Suspense>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">예정 공연</h2>
        <Suspense fallback={<Skeleton className="h-32" />}>
          <UpcomingPerformances limit={2} />
        </Suspense>
      </section>
    </div>
  );
}
```

2. src/domain/practice/components/UpcomingPractices.tsx - 기존 훅 재사용

3. src/domain/band/components/MyBands.tsx - 내가 속한 밴드 목록 (새 API 필요 시 백엔드 요청)

4. src/domain/performance/components/UpcomingPerformances.tsx - 기존 훅 재사용

5. 전체 화면 감사(audit):
- 모든 목록 페이지에 Skeleton, EmptyState, ErrorState 적용 확인
- 누락된 곳 수정

6. 접근성 감사:
- 모든 Dialog/BottomSheet에 포커스 트랩 확인
- 버튼/링크에 aria-label 확인
- 키보드 내비게이션(Tab, Enter, Escape) 테스트

7. Playwright E2E 테스트 확장 (tests/e2e/):
- auth.spec.ts: 회원가입 → 로그인 → 마이페이지 → 로그아웃
- band.spec.ts: 밴드 생성 → 상세 조회 → 가입 신청 → 승인
- practice.spec.ts: 합주 생성 → 세션 추가 → 배정 → 삭제
- performance.spec.ts: 공연 생성 → 합주 연결 → 삭제
- home.spec.ts: 홈 대시보드 3개 섹션 렌더링 확인

8. CI 그린 확인: pnpm lint, typecheck, format:check, test, build, test:e2e 모두 통과

9. src/app/error.tsx, src/app/not-found.tsx 최종 확인

**Test Strategy:**

전체 CI 파이프라인 그린 확인, 5개 도메인별 Playwright E2E 시나리오 통과, 접근성 체크리스트(키보드 내비, 포커스 트랩, aria-label) 수동 검증

## Subtasks

### 10.1. 도메인 모듈 구조 생성 및 홈 대시보드 API/훅 구현

**Status:** pending  
**Dependencies:** None  

src/domain/ 디렉토리 구조를 생성하고 practice, band, performance 각 도메인의 types, api, hooks 모듈을 구현합니다. 홈 대시보드에 필요한 목록 조회 API 함수와 TanStack Query 훅을 작성합니다.

**Details:**

1. src/domain/practice/, src/domain/band/, src/domain/performance/ 디렉토리 구조 생성
2. 각 도메인별 types/req.ts, types/res.ts 파일 작성 (PracticeInfoResponse, BandInfoResponse, PerformanceInfoResponse 등)
3. 각 도메인별 api/ 함수 구현:
   - practice/api/getPractices.ts (가까운 합주 목록)
   - band/api/getMyBands.ts (내 밴드 목록)
   - performance/api/getPerformances.ts (예정 공연 목록)
4. 각 도메인별 hooks/ 구현:
   - practice/hooks/useUpcomingPractices.ts
   - band/hooks/useMyBands.ts
   - performance/hooks/useUpcomingPerformances.ts
5. global/config/queryKeys.ts의 기존 쿼리 키 구조 활용
6. useInfiniteCursor 훅 또는 useQuery 적절히 활용

### 10.2. 홈 대시보드 위젯 컴포넌트 구현

**Status:** pending  
**Dependencies:** 10.1  

UpcomingPractices, MyBands, UpcomingPerformances 컴포넌트를 구현하고 홈 페이지에 통합합니다. 각 위젯에 Skeleton, EmptyState, ErrorState를 적용합니다.

**Details:**

1. src/domain/practice/components/UpcomingPractices.tsx 구현:
   - useUpcomingPractices(limit: 3) 훅 사용
   - 로딩 시 Skeleton, 데이터 없을 때 EmptyState, 에러 시 ErrorState 적용
   - PracticeCard 또는 간단한 리스트 아이템 렌더링
2. src/domain/band/components/MyBands.tsx 구현:
   - useMyBands() 훅 사용
   - 밴드 카드 리스트 또는 가로 스크롤 형태
3. src/domain/performance/components/UpcomingPerformances.tsx 구현:
   - useUpcomingPerformances(limit: 2) 훅 사용
   - 공연 카드 렌더링
4. src/app/(main)/home/page.tsx 업데이트:
   - Suspense 경계 내에 각 위젯 배치
   - 섹션별 제목과 간격 적용
5. 각 위젯 컴포넌트는 use client 지시어 사용

### 10.3. 전체 화면 Skeleton/EmptyState/ErrorState 감사 및 적용

**Status:** pending  
**Dependencies:** 10.2  

모든 목록 페이지(bands, practices, performances, me)에 Skeleton, EmptyState, ErrorState가 올바르게 적용되어 있는지 감사하고 누락된 곳을 수정합니다.

**Details:**

1. 감사 대상 페이지:
   - src/app/(main)/bands/page.tsx
   - src/app/(main)/practices/page.tsx
   - src/app/(main)/performances/page.tsx
   - src/app/(main)/me/page.tsx
2. 각 페이지에서 확인할 사항:
   - 데이터 로딩 중 Skeleton 표시 여부
   - 데이터가 비어있을 때 EmptyState 컴포넌트 사용 여부 (적절한 아이콘, 제목, 설명, 액션 버튼)
   - 에러 발생 시 ErrorState 컴포넌트 사용 여부 (재시도 버튼 포함)
3. src/app/error.tsx 전역 에러 바운더리 페이지 구현:
   - ErrorState 컴포넌트 활용
   - reset 함수로 재시도 기능 제공
4. src/app/not-found.tsx 404 페이지 구현:
   - EmptyState 스타일로 구현
   - 홈으로 돌아가기 버튼
5. 누락된 곳 수정 및 일관성 확보

### 10.4. 접근성 감사 및 개선

**Status:** pending  
**Dependencies:** 10.3  

모든 Dialog, BottomSheet, 버튼, 링크에 대한 접근성을 감사하고 개선합니다. 포커스 트랩, aria-label, 키보드 내비게이션을 검증합니다.

**Details:**

1. Dialog/BottomSheet 접근성 확인:
   - components/ui/dialog.tsx, components/ui/bottom-sheet.tsx에 포커스 트랩 적용 여부
   - ESC 키로 닫기 동작 확인
   - 열릴 때 첫 번째 포커스 가능 요소로 포커스 이동
   - 닫힐 때 트리거 요소로 포커스 복귀
2. 버튼/링크 접근성:
   - 아이콘만 있는 버튼에 aria-label 적용 확인
   - 비활성화된 버튼에 aria-disabled 적용
3. 네비게이션 접근성:
   - Tab 키로 모든 인터랙티브 요소 접근 가능
   - Enter/Space로 버튼 활성화
   - 현재 페이지 표시 (aria-current)
4. 폼 접근성:
   - 입력 필드와 레이블 연결 (htmlFor/id)
   - 에러 메시지 연결 (aria-describedby)
5. 수정이 필요한 컴포넌트 업데이트

### 10.5. Playwright E2E 테스트 작성 및 CI 검증

**Status:** pending  
**Dependencies:** 10.4  

5개 도메인별 E2E 테스트를 작성하고 전체 CI 파이프라인(lint, typecheck, format, test, build, test:e2e)이 통과하는지 확인합니다.

**Details:**

1. tests/e2e/ 디렉토리 생성
2. E2E 테스트 파일 작성:
   - tests/e2e/auth.spec.ts: 회원가입 → 로그인 → 마이페이지 → 로그아웃 플로우
   - tests/e2e/band.spec.ts: 밴드 생성 → 상세 조회 → 가입 신청 → 승인 플로우
   - tests/e2e/practice.spec.ts: 합주 생성 → 세션 추가 → 배정 → 삭제 플로우
   - tests/e2e/performance.spec.ts: 공연 생성 → 합주 연결 → 삭제 플로우
   - tests/e2e/home.spec.ts: 홈 대시보드 3개 섹션 렌더링 확인
3. 테스트 유틸리티 설정:
   - tests/e2e/fixtures/ 디렉토리에 공통 fixture 정의
   - 로그인 상태 유지를 위한 storageState 활용
4. CI 검증:
   - pnpm lint 통과 확인
   - pnpm typecheck 통과 확인
   - pnpm format:check 통과 확인
   - pnpm test 통과 확인
   - pnpm build 통과 확인
   - pnpm test:e2e 통과 확인
5. 실패하는 테스트 수정
