# Task ID: 9

**Title:** 홈 화면 섹션 노출 개수 상한 적용 (최대 3건) 및 조건부 전체 보기 액션

**Status:** pending

**Dependencies:** 2

**Priority:** medium

**Description:** 홈 화면의 '내 밴드', '다가오는 합주', '다가오는 공연' 섹션에 최대 3건 노출 제한을 적용하고, 4건 이상일 때만 '전체 보기' 액션을 표시하며, 3건 미만일 때는 placeholder 카드 또는 EmptyState를 노출한다.

**Details:**

**개요:**
현재 홈 화면(`src/app/(main)/home/page.tsx`)의 3개 섹션(내 밴드, 다가오는 합주, 다가오는 공연)에 노출 개수 상한(3건)을 적용하고, 데이터 정렬/필터링 로직을 hook 또는 컴포넌트 단계에 격리하여 향후 백엔드 알고리즘 엔드포인트 교체에 대비한다.

**1. 정렬/필터 유틸 분리 (`src/lib/home-feed.ts` 신규):**
향후 백엔드 `/home/feed` 엔드포인트로 대체 가능하도록 정렬/필터 로직을 한 곳에 격리한다.

```ts
import { parseKst } from '@/lib/date';
import type { PracticeListItemResponse } from '@/domain/practice/types';
import type { PerformanceListItemResponse } from '@/domain/performance/types';

const HOME_SECTION_LIMIT = 3;

/** 내 밴드: 백엔드 정렬 기준 그대로 상위 3건 */
export function sliceMyBands<T>(items: T[]): T[] {
  return items.slice(0, HOME_SECTION_LIMIT);
}

/** 다가오는 합주: startAt >= now, startAt 오름차순 정렬 후 상위 3건 */
export function filterUpcomingPractices(
  items: PracticeListItemResponse[],
  now: Date = new Date(),
): PracticeListItemResponse[] {
  return items
    .filter((p) => parseKst(p.startAt) >= now)
    .sort((a, b) => parseKst(a.startAt).getTime() - parseKst(b.startAt).getTime())
    .slice(0, HOME_SECTION_LIMIT);
}

/** 다가오는 공연: startAt >= now, startAt 오름차순 정렬 후 상위 3건 */
export function filterUpcomingPerformances(
  items: PerformanceListItemResponse[],
  now: Date = new Date(),
): PerformanceListItemResponse[] {
  return items
    .filter((p) => parseKst(p.startAt) >= now)
    .sort((a, b) => parseKst(a.startAt).getTime() - parseKst(b.startAt).getTime())
    .slice(0, HOME_SECTION_LIMIT);
}

export function hasMoreThanLimit(totalCount: number): boolean {
  return totalCount > HOME_SECTION_LIMIT;
}
```

**2. 홈 전용 섹션 컴포넌트 신규 생성:**
기존 `MyBands`, `UpcomingPractices`, `UpcomingPerformances`는 범용이므로 홈 전용 래퍼 컴포넌트를 생성한다.

- `src/app/(main)/home/HomeMyBandsSection.client.tsx`:
  - `useMyBands(limit=20)` 호출 (여유 있게 fetch 후 클라이언트에서 3건 slice)
  - `sliceMyBands(data)` 로 상위 3건 추출
  - 3건 미만: `EmptyState` 또는 placeholder 카드 (현재 디자인 톤 유지)
  - `totalCount > 3` 이면 `showViewAll=true` prop을 부모에 전달

- `src/app/(main)/home/HomeUpcomingPracticeSection.client.tsx`:
  - `useUpcomingPractices(limit=20)` 호출
  - `filterUpcomingPractices(data)` 로 미래 합주만 3건 추출
  - 빈 경우 기존 EmptyState 사용

- `src/app/(main)/home/HomeUpcomingPerformanceSection.client.tsx`:
  - `useUpcomingPerformances(limit=20)` 호출
  - `filterUpcomingPerformances(data)` 로 미래 공연만 3건 추출

**3. page.tsx 수정 (`src/app/(main)/home/page.tsx`):**
- 기존 `<MyBands limit={6} />` → `<HomeMyBandsSection />`
- 기존 `<UpcomingPractices limit={3} />` → `<HomeUpcomingPracticeSection />`
- 기존 `<UpcomingPerformances limit={3} />` → `<HomeUpcomingPerformanceSection />`
- ViewAllLink 조건부 렌더링: 각 섹션 컴포넌트가 `totalCount` 또는 `hasMore` 콜백을 통해 4건 이상 여부를 부모에 전달하거나, 섹션 내부에서 SectionTitle의 action을 조건부 렌더링

**4. SectionTitle action 조건부 렌더링:**
```tsx
<SectionTitle
  title="내 밴드"
  action={hasMoreBands ? <ViewAllLink href={ROUTES.BANDS} label="전체 밴드 보기" /> : undefined}
/>
```
- 4건 이상일 때만 `action` prop 전달
- 3건 이하일 때는 `action={undefined}` 로 전체 보기 링크 숨김

**5. Placeholder 카드 컴포넌트 (선택사항):**
3건 미만일 때 빈 공간을 채우려면 `PlaceholderCard` 컴포넌트를 `src/components/ui/placeholder-card.tsx`에 생성.
```tsx
export function PlaceholderCard({ className }: { className?: string }) {
  return (
    <div className={cn('border-dashed border-border rounded-md border p-4 opacity-50', className)}>
      <p className="text-foreground-muted text-sm text-center">추가 데이터 없음</p>
    </div>
  );
}
```
단, 현재 디자인 톤에 맞게 EmptyState만 사용해도 무방.

**6. API_REQUIRED.md 업데이트:**
`FE-API-019` 항목 추가:
```markdown
### FE-API-019. 홈 피드 우선순위 정렬 엔드포인트

- **엔드포인트**: `GET /api/v1/home/feed`
- **요청 헤더**: `Authorization: Bearer <accessToken>`
- **기대 응답**:
```json
{
  "success": true,
  "data": {
    "bands": [...],      // 상위 3건, 알고리즘 정렬
    "practices": [...],  // 다가오는 합주 상위 3건
    "performances": [...] // 다가오는 공연 상위 3건
  }
}
```
- **프론트 사용처**: `src/app/(main)/home/` 섹션 컴포넌트
- **현재 우회**: 각 도메인별 list API를 개별 호출 후 클라이언트에서 정렬/필터링
- **백엔드 구현 시**: `src/lib/home-feed.ts` 유틸 제거, hook fetcher를 단일 엔드포인트로 교체
```

**파일 변경 목록:**
1. `src/lib/home-feed.ts` (신규) — 정렬/필터 유틸
2. `src/app/(main)/home/HomeMyBandsSection.client.tsx` (신규)
3. `src/app/(main)/home/HomeUpcomingPracticeSection.client.tsx` (신규)
4. `src/app/(main)/home/HomeUpcomingPerformanceSection.client.tsx` (신규)
5. `src/app/(main)/home/page.tsx` (수정) — 신규 섹션 컴포넌트 사용
6. `API_REQUIRED.md` (수정) — FE-API-019 항목 추가
7. (선택) `src/components/ui/placeholder-card.tsx` — placeholder 카드

**Test Strategy:**

**1. 단위 테스트 (`src/lib/home-feed.test.ts`):**
- `sliceMyBands`: 10건 입력 시 3건 반환 확인
- `filterUpcomingPractices`: 과거 3건 + 미래 5건 입력 시 미래 3건만 startAt 오름차순 반환 확인
- `filterUpcomingPerformances`: 동일 로직 테스트
- `hasMoreThanLimit(4)` → true, `hasMoreThanLimit(3)` → false

**2. 컴포넌트 시각 확인:**
- 홈 화면 진입 후 각 섹션이 최대 3건만 렌더링되는지 확인
- 4건 이상 데이터 존재 시 '전체 보기 →' 링크 노출 확인
- 3건 이하 데이터 시 '전체 보기 →' 링크 미노출 확인
- 0건일 때 EmptyState 정상 표시 확인

**3. 정렬 확인:**
- 합주/공연 섹션: 현재 시각 이후 데이터만 표시, startAt 오름차순(가장 임박한 순) 정렬 확인
- 내 밴드 섹션: 백엔드 응답 순서 그대로 상위 3건 표시 확인

**4. 라우팅 확인:**
- '전체 보기 →' 클릭 시 각각 `/bands`, `/practices`, `/performances` 이동 확인

**5. lint/typecheck:**
- `pnpm typecheck && pnpm lint` 통과 확인

**6. API_REQUIRED.md 검증:**
- FE-API-019 항목이 올바른 섹션에 추가되었는지 확인
- 마크다운 포맷 정상 여부 확인

## Subtasks

### 9.1. 정렬/필터 유틸 함수 분리 (src/lib/home-feed.ts 신규)

**Status:** pending  
**Dependencies:** None  

홈 화면 섹션별 데이터 정렬/필터링 로직을 별도 유틸 파일로 격리하여 향후 백엔드 /home/feed 엔드포인트 교체에 대비한다.

**Details:**

src/lib/home-feed.ts 파일을 신규 생성하고 다음 함수들을 구현:

1. HOME_SECTION_LIMIT = 3 상수 정의
2. sliceMyBands<T>(items: T[]): T[] - 상위 3건 slice
3. filterUpcomingPractices(items: PracticeListItemResponse[], now?: Date): PracticeListItemResponse[] - parseKst로 startAt >= now 필터 후 오름차순 정렬, 상위 3건 반환
4. filterUpcomingPerformances(items: PerformanceListItemResponse[], now?: Date): PerformanceListItemResponse[] - 동일 로직
5. hasMoreThanLimit(totalCount: number): boolean - totalCount > 3 여부 반환

import 경로: @/lib/date의 parseKst, @/domain/practice/types와 @/domain/performance/types의 응답 타입

### 9.2. 홈 전용 섹션 컴포넌트 3종 신규 생성

**Status:** pending  
**Dependencies:** 9.1  

HomeMyBandsSection, HomeUpcomingPracticeSection, HomeUpcomingPerformanceSection 클라이언트 컴포넌트를 생성하여 3건 제한 및 totalCount 노출 로직을 캡슐화한다.

**Details:**

src/app/(main)/home/ 경로에 3개 파일 생성:

1. HomeMyBandsSection.client.tsx:
- useMyBands(20)으로 여유있게 fetch
- sliceMyBands로 상위 3건 추출
- onTotalCount?: (count: number) => void 콜백 또는 내부에서 hasMore 계산
- 0건시 EmptyState (icon=Users), 렌더링은 기존 BandCard 재사용

2. HomeUpcomingPracticeSection.client.tsx:
- useUpcomingPractices(20) 호출
- filterUpcomingPractices로 미래 합주 3건 필터
- 0건시 EmptyState (icon=Music)
- PracticeCard 재사용

3. HomeUpcomingPerformanceSection.client.tsx:
- useUpcomingPerformances(20) 호출
- filterUpcomingPerformances로 미래 공연 3건 필터
- 0건시 EmptyState (icon=CalendarDays)
- PerformanceCard 재사용

### 9.3. ViewAllLink 조건부 렌더링 로직 구현

**Status:** pending  
**Dependencies:** 9.1, 9.2  

각 홈 섹션 컴포넌트가 totalCount > 3일 때만 SectionTitle의 action prop에 ViewAllLink를 전달하도록 구현한다.

**Details:**

두 가지 구현 방식 중 선택:

방식 A (권장 - 섹션 내부 캡슐화):
- 각 Home*Section 컴포넌트가 SectionTitle을 포함
- 내부에서 hasMoreThanLimit(data.length)로 판단
- showViewAll이 true일 때만 action prop 전달

방식 B (부모에서 관리):
- Home*Section이 onHasMore 콜백 prop을 받음
- page.tsx에서 상태로 관리하여 SectionTitle에 전달

방식 A 채택시:
- HomeMyBandsSection에서 <SectionTitle title='내 밴드' action={hasMore ? <ViewAllLink href={ROUTES.BANDS} label='전체 밴드 보기' /> : undefined} /> 패턴 적용
- ViewAllLink 컴포넌트는 page.tsx에서 섹션 컴포넌트로 이동하거나 공용 컴포넌트화

### 9.4. 홈 페이지(page.tsx) 신규 섹션 컴포넌트로 교체

**Status:** pending  
**Dependencies:** 9.2, 9.3  

src/app/(main)/home/page.tsx에서 기존 범용 컴포넌트를 신규 홈 전용 섹션 컴포넌트로 교체하고 불필요한 코드를 제거한다.

**Details:**

page.tsx 수정 내용:

1. import 변경:
- 기존: import { MyBands } from '@/domain/band/components/MyBands'
- 신규: import { HomeMyBandsSection } from './HomeMyBandsSection.client'
- 동일하게 UpcomingPractices → HomeUpcomingPracticeSection
- 동일하게 UpcomingPerformances → HomeUpcomingPerformanceSection

2. JSX 변경:
- <MyBands limit={6} /> → <HomeMyBandsSection />
- <UpcomingPractices limit={3} /> → <HomeUpcomingPracticeSection />
- <UpcomingPerformances limit={3} /> → <HomeUpcomingPerformanceSection />

3. ViewAllLink 및 SectionTitle을 섹션 컴포넌트 내부로 이동했다면 page.tsx에서 해당 부분 제거

4. 불필요해진 import 정리

### 9.5. API_REQUIRED.md에 FE-API-019 홈 피드 엔드포인트 항목 추가

**Status:** pending  
**Dependencies:** 9.1, 9.2, 9.3, 9.4  

향후 백엔드 /home/feed 단일 엔드포인트 구현을 위한 요구사항을 API_REQUIRED.md 문서에 추가한다.

**Details:**

API_REQUIRED.md 파일의 '신규 기능' 섹션에 FE-API-019 항목 추가:

### FE-API-019. 홈 피드 우선순위 정렬 엔드포인트

- **엔드포인트**: GET /api/v1/home/feed
- **요청 헤더**: Authorization: Bearer <accessToken>
- **기대 응답**:
```json
{
  "success": true,
  "data": {
    "bands": [...],      // 내 밴드 상위 3건, 알고리즘 정렬
    "practices": [...],  // 다가오는 합주 상위 3건, startAt 오름차순
    "performances": [...] // 다가오는 공연 상위 3건, startAt 오름차순
  }
}
```
- **프론트 사용처**: src/app/(main)/home/ 섹션 컴포넌트
- **현재 우회**: 각 도메인별 list API를 개별 호출 후 클라이언트에서 정렬/필터링 (src/lib/home-feed.ts)
- **백엔드 구현 시**: src/lib/home-feed.ts 유틸 제거, hook fetcher를 단일 엔드포인트로 교체
