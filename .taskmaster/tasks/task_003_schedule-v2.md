# Task ID: 3

**Title:** 일/주/월 단위 전환 시각화

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** 합주 기간 길이에 따른 자동 단위 추천 + 사용자 토글. 14일 이하=일, 15-60일=주, 60일 초과=월 단위. 좌우 이동 + '오늘로' 단축 버튼.

**Details:**

1. domain/schedule-coordination/utils.ts 확장
   - getViewUnit(from, to): 'day' | 'week' | 'month'
   - enumerateWeeks(from, to): string[] (주 시작일 목록)
   - enumerateMonths(from, to): string[] (월 시작일 목록)
2. useScheduleViewUnit 훅 생성
   - 자동 추천 단위 계산
   - 사용자 오버라이드 상태
   - 현재 뷰포트 (startDate) 관리
   - 좌/우 이동 + '오늘로' 액션
3. 시각화 컴포넌트별 단위 대응:
   - 일: 7열 그리드 1-2주 (enumerateDays 전체)
   - 주: 1주씩 좌/우 이동 (기존 v1 패턴)
   - 월: 한 달 캘린더, 셀당 가용 인원 농도 표기
4. ViewUnitToggle.tsx 컴포넌트 - 세그먼트 버튼 (일/주/월)
5. 좌/우 이동 ChevronLeft/ChevronRight + '오늘' 버튼

```ts
function getViewUnit(from: string, to: string): 'day' | 'week' | 'month' {
  const days = enumerateDays(from, to).length;
  if (days <= 14) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}
```

**Test Strategy:**

1. 14일 이하 기간 - 자동으로 'day' 단위
2. 15-60일 기간 - 자동으로 'week' 단위
3. 60일 초과 기간 - 자동으로 'month' 단위
4. 사용자 단위 전환 시 뷰 변경
5. 좌/우 이동 버튼 동작
6. '오늘로' 버튼 클릭 시 현재 날짜 뷰로 이동

## Subtasks

### 3.1. utils.ts 확장 - getViewUnit, enumerateWeeks, enumerateMonths 유틸 함수 구현

**Status:** pending  
**Dependencies:** None  

합주 기간 길이에 따른 뷰 단위 자동 추천 로직과 주/월 열거 유틸리티 함수를 schedule-coordination/utils.ts에 추가

**Details:**

1. src/domain/schedule-coordination/utils.ts 파일에 다음 함수 추가:

- getViewUnit(from: string, to: string): 'day' | 'week' | 'month'
  - 기존 enumerateDays 함수를 활용하여 일수 계산
  - 14일 이하 → 'day', 15-60일 → 'week', 60일 초과 → 'month'
  - from/to 유효성 검사 (빈 문자열, 잘못된 형식 시 'day' 기본값)

- enumerateWeeks(from: string, to: string): string[]
  - 기존 startOfWeek 함수 활용
  - from~to 범위 내 각 주의 월요일 시작일 목록 반환
  - 첫 주는 from이 속한 주의 월요일, 마지막 주는 to가 속한 주 포함

- enumerateMonths(from: string, to: string): string[]
  - 각 월의 첫 날(YYYY-MM-01) 목록 반환
  - from이 속한 월부터 to가 속한 월까지 포함

2. 기존 safeDate, startOfWeek, addDays 함수 재활용
3. 각 함수에 JSDoc 주석 추가

### 3.2. useScheduleViewUnit 훅 구현 - 뷰 단위 상태 관리 및 네비게이션

**Status:** pending  
**Dependencies:** 3.1  

자동 추천 뷰 단위 계산, 사용자 오버라이드 상태, 현재 뷰포트 관리, 좌/우 이동 및 '오늘로' 액션을 제공하는 커스텀 훅 생성

**Details:**

1. src/domain/schedule-coordination/hooks/useScheduleViewUnit.ts 파일 생성

2. 훅 인터페이스 설계:
```ts
interface UseScheduleViewUnitProps {
  from: string;  // practiceWindow.from
  to: string;    // practiceWindow.to
}

interface UseScheduleViewUnitReturn {
  recommendedUnit: 'day' | 'week' | 'month';
  activeUnit: 'day' | 'week' | 'month';
  setActiveUnit: (unit: 'day' | 'week' | 'month') => void;
  viewportStart: string;  // 현재 뷰포트 시작일
  goToPrev: () => void;   // 이전 (일/주/월)
  goToNext: () => void;   // 다음 (일/주/월)
  goToToday: () => void;  // 오늘로 이동
  canGoPrev: boolean;     // from 이전으로 가는 것 방지
  canGoNext: boolean;     // to 이후로 가는 것 방지
}
```

3. 구현 상세:
- useState로 activeUnit(사용자 오버라이드), viewportStart 관리
- getViewUnit으로 recommendedUnit 계산 (from/to 변경 시 자동 반영)
- goToPrev/Next: activeUnit에 따라 1일/7일/1개월 이동
- goToToday: 오늘 날짜가 from~to 범위 내면 해당 위치, 아니면 from으로
- canGoPrev/Next: viewportStart가 범위 밖으로 나가지 않도록 제어

4. 기존 ScheduleInputModal.client.tsx의 weekStart 패턴 참고하여 일관된 날짜 계산

### 3.3. ViewUnitToggle 컴포넌트 구현 - 세그먼트 버튼 UI

**Status:** pending  
**Dependencies:** None  

일/주/월 단위 전환을 위한 세그먼트 버튼 스타일 토글 컴포넌트 생성

**Details:**

1. src/domain/schedule-coordination/components/ViewUnitToggle.client.tsx 파일 생성

2. 컴포넌트 Props:
```ts
interface ViewUnitToggleProps {
  value: 'day' | 'week' | 'month';
  onChange: (unit: 'day' | 'week' | 'month') => void;
  recommendedUnit?: 'day' | 'week' | 'month';  // 추천 단위 표시용
}
```

3. UI 구현:
- 3개 버튼(일/주/월)을 inline-flex로 배치
- 선택된 버튼: bg-accent text-foreground
- 비선택 버튼: bg-card text-foreground-muted hover:bg-card-hover
- 추천 단위에 작은 점(dot) 또는 '추천' 라벨 표시 (선택적)
- rounded-md border-border 스타일 (기존 Tabs pill 스타일 참고)

4. 기존 src/components/ui/tabs.tsx의 pill variant 스타일 참조
- 접근성: aria-label, role="tablist" / role="tab"

5. 모바일에서도 터치하기 쉬운 최소 터치 영역(44px) 확보

### 3.4. ViewUnitNavigation 컴포넌트 및 SchedulingMain 통합

**Status:** pending  
**Dependencies:** 3.1, 3.2, 3.3  

좌/우 이동 버튼과 '오늘' 버튼을 포함한 네비게이션 컴포넌트 구현 및 SchedulingMain에 뷰 단위 전환 기능 통합

**Details:**

1. src/domain/schedule-coordination/components/ViewUnitNavigation.client.tsx 생성

2. 컴포넌트 Props:
```ts
interface ViewUnitNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  label: string;  // 현재 뷰포트 표시 (예: '2026-04-26 ~ 05-02' 또는 '2026년 5월')
}
```

3. UI 구현:
- 좌우로 ChevronLeft/ChevronRight 버튼 (lucide-react 아이콘)
- 중앙에 현재 뷰포트 라벨 (font-mono font-bold)
- '오늘' 버튼: text-accent 링크 스타일 또는 작은 버튼
- disabled 상태 시 opacity-50 cursor-not-allowed
- 기존 ScheduleInputModal의 주간 네비게이션 스타일 참조

4. SchedulingMain.client.tsx 수정:
- useScheduleViewUnit 훅 import 및 사용
- 헤더 영역에 ViewUnitToggle + ViewUnitNavigation 배치
- activeUnit에 따른 시각화 분기 준비 (일: 7열 그리드, 주: 기존 패턴, 월: 캘린더)
- allDays 대신 activeUnit 기반 날짜 범위 사용

5. MemberSchedulePanel, SongMatrixPanel의 allDays prop을 동적 날짜 범위로 교체 준비
