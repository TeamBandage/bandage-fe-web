# Task ID: 2

**Title:** 공연 사이드바 분리 + 풀페이지 마법사 전환

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 공연 사이드바를 합주와 동일하게 '나의 공연' / '공연 생성' 서브메뉴로 분리하고, 공연 생성을 풀페이지 마법사로 교체한다.

**Details:**

## 구현 대상

1. **Sidebar 공연 expandable** (`src/components/layout/sidebar.tsx`)
   - `mainNav` 배열의 공연 항목에 `subs` 추가:
   ```ts
   { href: ROUTES.PERFORMANCES, label: '공연', icon: CalendarDays,
     subs: [
       { href: ROUTES.PERFORMANCES, label: '나의 공연' },
       { href: ROUTES.PERFORMANCE_NEW, label: '공연 생성' },
     ] }
   ```

2. **PerformanceCreateWizard** (`src/app/(main)/performances/new/PerformanceCreateWizard.client.tsx`)
   - 기존 `PerformanceCreateForm.client.tsx`를 마법사로 전환
   - Step 구조: 0: 기본 정보 (제목/설명), 1: 참여 밴드 (BandPickerModal), 2: 일정 (시작/소요시간), 3: 검토 및 확정 (Task 5와 연계)
   - Step 0/1/2는 기존 PerformanceCreateModal 로직 재사용
   - `useDirtyForm()` 연동 (Task 1 완료 후)

3. **performances/new/page.tsx** 수정
   - `PerformanceCreateWizard` 컴포넌트로 교체

4. **performances/layout.tsx** 수정 (`/performances/new` 풀페이지 opt-out)
   - `pathname.includes('/new')` 조건으로 PaneSplit 레이아웃 대신 단일 children 렌더
   - 합주 `/practices/new` 와 동일 패턴 적용

5. **PerformanceCreateModal 제거**
   - `src/domain/performance/components/PerformanceCreateModal.client.tsx` 삭제
   - `PerformancesListPane.client.tsx`의 트리거를 `Link to={ROUTES.PERFORMANCE_NEW}` 버튼으로 교체

## 의사 코드
```tsx
// PerformanceCreateWizard.client.tsx
const STEPS = ['기본 정보', '참여 밴드', '일정', '검토'] as const;
const [step, setStep] = useState<0|1|2|3>(0);
const [selectedBands, setSelectedBands] = useState<BandInfoResponse[]>([]);
// Step 0: title input
// Step 1: BandPickerModal multiple selection
// Step 2: DateTimePicker + durationMinutes
// Step 3: WizardSummaryCard (Task 5) + 최종 제출 버튼
```

**Test Strategy:**

1. 사이드바 공연 클릭 → 서브메뉴 펼침 확인 (나의 공연/공연 생성)
2. /performances/new 직접 접근 → 풀페이지 마법사 렌더링
3. Step 0→1→2→3 이동 및 이전/다음 버튼 동작
4. Step 3 검토 패널에서 입력값 올바르게 표시
5. 기존 PerformancesListPane 의 "새 공연" 버튼 클릭 → /performances/new 라우트 이동
6. PerformanceCreateModal 컴포넌트 import 시 빌드 에러 (삭제 확인)
7. 모바일(<960px)에서도 풀페이지 마법사 동작 확인

## Subtasks

### 2.1. 사이드바 공연 메뉴에 expandable 서브메뉴 추가

**Status:** pending  
**Dependencies:** None  

sidebar.tsx의 mainNav 배열에서 공연 항목에 subs 배열을 추가하여 '나의 공연' / '공연 생성' 서브메뉴로 분리한다.

**Details:**

src/components/layout/sidebar.tsx 파일에서 현재 46번째 줄의 공연 항목을 수정한다. 합주 메뉴(37-45줄)와 동일한 패턴으로 subs 배열을 추가:

```ts
{ href: ROUTES.PERFORMANCES, label: '공연', icon: CalendarDays,
  subs: [
    { href: ROUTES.PERFORMANCES, label: '나의 공연' },
    { href: ROUTES.PERFORMANCE_NEW, label: '공연 생성' },
  ] }
```

기존 NavRow 컴포넌트의 expandable 로직(hasSubs, open 상태, ChevronDown 아이콘)이 이미 구현되어 있으므로 subs 배열만 추가하면 자동으로 동작한다. isSubActive 함수도 /performances 정확 매칭을 위해 조건 추가 필요.

### 2.2. PerformanceCreateWizard 풀페이지 마법사 컴포넌트 구현

**Status:** pending  
**Dependencies:** 2.1  

기존 PerformanceCreateModal의 로직을 재사용하여 4단계 풀페이지 마법사 형태의 PerformanceCreateWizard.client.tsx를 생성한다.

**Details:**

src/app/(main)/performances/new/PerformanceCreateWizard.client.tsx 파일 생성. PracticeCreateWizard.client.tsx 패턴을 따르되 공연 생성에 맞게 수정:

STEPS = ['기본 정보', '참여 밴드', '일정', '검토'] as const;

Step 0 (기본 정보):
- title Input (필수)
- description Textarea (선택)

Step 1 (참여 밴드):
- BandPickerModal multiple 선택 모드
- 선택된 밴드 칩 리스트 (X 버튼으로 제거)
- '밴드 검색해서 추가' 버튼

Step 2 (일정):
- DateTimePicker (startAt)
- durationMinutes Input (type=number)
- venue Textarea (선택)

Step 3 (검토):
- 입력값 요약 카드 (Task 5의 WizardSummaryCard와 연계 준비)
- 최종 '공연 만들기' 버튼

기존 PerformanceCreateModal의 useCreatePerformance 훅, createPerformanceSchema, BandPickerModal 연동 로직 재사용. useDirtyForm() 연동은 Task 1 완료 후 추가.

### 2.3. performances/layout.tsx 풀페이지 opt-out 및 page.tsx 수정

**Status:** pending  
**Dependencies:** 2.2  

/performances/new 경로에서 PaneSplit 레이아웃 대신 단일 children만 렌더링하도록 layout.tsx를 수정하고, page.tsx에서 PerformanceCreateWizard를 사용하도록 변경한다.

**Details:**

1. src/app/(main)/performances/layout.tsx 수정:
   - practices/layout.tsx 패턴 적용
   - usePathname으로 현재 경로 확인
   - pathname === ROUTES.PERFORMANCE_NEW || pathname.startsWith(`${ROUTES.PERFORMANCE_NEW}/`) 조건으로 fullPage 판정
   - fullPage 시 PerformancesListPane 미노출, 단일 `<div className="h-full overflow-y-auto">{children}</div>` 반환

2. src/app/(main)/performances/new/page.tsx 수정 (이미 존재하면 수정, 없으면 생성):
   - Metadata 설정: title: '공연 만들기 | Bandage'
   - PerformanceCreateWizard 컴포넌트 import 및 렌더링

import 추가:
- 'use client' from usePathname
- ROUTES from '@/global/config/routes'

### 2.4. PerformanceCreateModal 제거 및 PerformancesListPane 트리거 교체

**Status:** pending  
**Dependencies:** 2.3  

PerformanceCreateModal.client.tsx 파일을 삭제하고, PerformancesListPane의 '새 공연' 버튼을 /performances/new로 이동하는 Link 버튼으로 교체한다.

**Details:**

1. src/app/(main)/performances/PerformancesListPane.client.tsx 수정:
   - PerformanceCreateModal import 제거
   - 80-86줄의 PerformanceCreateModal 컴포넌트를 Link 버튼으로 교체:
   ```tsx
   <Button size="sm" variant="accent-outline" asChild aria-label="새 공연 만들기">
     <Link href={ROUTES.PERFORMANCE_NEW}>
       <Plus className="h-4 w-4" /> 새 공연
     </Link>
   </Button>
   ```
   - Link import 추가 (이미 있으면 유지)

2. src/domain/performance/components/PerformanceCreateModal.client.tsx 삭제:
   - 파일 완전 삭제
   - 다른 파일에서 import 참조가 없는지 확인 (Grep으로 검색)

삭제 전 PerformanceCreateModal의 핵심 로직(폼 상태, mutation, 밴드 선택)은 PerformanceCreateWizard로 이미 이전됨.
