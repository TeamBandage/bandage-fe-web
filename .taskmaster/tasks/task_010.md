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
