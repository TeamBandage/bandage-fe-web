# Task ID: 6

**Title:** Home 화면 재구성 (StatCard 그리드 + 섹션 레이아웃)

**Status:** done

**Dependencies:** 3 ✓, 5 ✓

**Priority:** medium

**Description:** /home 화면을 디자인 원본 기준으로 재구성한다. 데스크톱에서는 4-StatCard 그리드 + grid-2(내 밴드/다가오는 합주) + grid-3(다가오는 공연), 모바일에서는 단일 컬럼 스택 구조로 구현한다.

**Details:**

1. src/app/(main)/home/page.tsx 재구성:
   - PageTitle(greeting + sub): "안녕하세요, {name}님" + "오늘도 좋은 합주 되세요."
   - StatCard x4 그리드: 소속 밴드 / 예정 합주 / 예정 공연 / 참여 세션
     - 데스크톱: grid-cols-4
     - 모바일: grid-cols-2
   - 내 밴드 + 다가오는 합주 2열 그리드
     - 데스크톱: grid-cols-2
     - 모바일: 단일 컬럼
   - 다가오는 공연 3열 그리드
     - 데스크톱: grid-cols-3
     - 모바일: 단일 컬럼

2. SectionTitle 컴포넌트 활용하여 각 섹션 헤더 구성
   - action 슬롯에 "전체 보기 →" 링크

3. 통계 데이터 훅 구현/활용:
   - useMyBands, useUpcomingPractices, useUpcomingPerformances 기존 훅에서 count 파생
   - 세션 참여 수는 TanStack Query select로 계산

4. Topbar 연동: 데스크톱에서는 Topbar에 "홈" 타이틀 표시

**Test Strategy:**

1. 데스크톱(1440px)에서 4열/2열/3열 그리드 레이아웃 확인
2. 모바일(375px)에서 단일 컬럼 스택 확인
3. StatCard 숫자가 실제 API 데이터와 일치하는지 확인
4. Playwright E2E: 홈 화면 렌더링 데스크톱+모바일 테스트

## Subtasks

### 6.1. StatCard 컴포넌트 구현 (src/components/ui/stat-card.tsx)

**Status:** done  
**Dependencies:** None  

디자인 시스템의 Stat 컴포넌트를 React/Tailwind로 구현한다. IconTile + 수치/라벨 조합의 통계 카드 컴포넌트를 생성한다.

**Details:**

1. src/components/ui/stat-card.tsx 파일 생성
2. Props 정의: { label: string; value: number | string; icon: LucideIcon; tone: 'accent' | 'success' | 'amber' | 'warn' }
3. 디자인 참조: design/dist/css/components.css의 .stat 스타일 (.stat { padding: 20px; gap: 14px; border-radius: var(--r-lg) })
4. IconTile 영역: 44x44 정사각형, tone별 배경색(accent-dim, success-dim 등) + 아이콘
5. 수치 영역: .stat__value (text-2xl font-extrabold), .stat__label (text-xs text-foreground-muted)
6. Tailwind 클래스로 스타일 적용: bg-card, border border-border, rounded-lg, p-5, flex items-center gap-3.5
7. 반응형: 모바일에서는 padding 축소(p-4), 아이콘 크기 축소(36x36) 고려

### 6.2. SectionTitle 컴포넌트 구현 (src/components/layout/section-title.tsx)

**Status:** done  
**Dependencies:** None  

각 섹션 헤더에 사용할 SectionTitle 컴포넌트를 구현한다. 제목 텍스트와 우측 action 슬롯을 지원한다.

**Details:**

1. src/components/layout/section-title.tsx 파일 생성
2. Props 정의: { title: string; action?: ReactNode; className?: string }
3. 디자인 참조: design/dist/js/components.js의 SectionTitle 함수 (class: 'section-title')
4. 레이아웃: flex justify-between items-center
5. 제목: text-sm font-semibold text-foreground
6. action 슬롯: '전체 보기 →' 링크 등을 받아 우측에 렌더링
7. action 슬롯 스타일: text-xs text-accent hover:underline
8. next/link의 Link 컴포넌트로 href 전달 가능하도록 action을 ReactNode로 유지

### 6.3. 홈 통계 데이터 훅 구현 (useHomeStats)

**Status:** done  
**Dependencies:** None  

홈 화면의 StatCard에 표시할 통계 데이터(소속 밴드 수, 예정 합주 수, 예정 공연 수, 참여 세션 수)를 집계하는 커스텀 훅을 구현한다.

**Details:**

1. src/domain/member/hooks/useHomeStats.ts 파일 생성 (또는 src/app/(main)/home/ 하위에 로컬 훅으로)
2. 기존 훅 활용: useMyBands, useUpcomingPractices, useUpcomingPerformances
3. 각 훅에서 data?.length를 통해 count 파생
4. 참여 세션 수: useUpcomingPractices 결과에서 participant로 참여한 세션 수를 TanStack Query select로 계산 (또는 별도 API가 없으면 일단 practices.flatMap(p => p.sessions).filter(s => s.assignee === me).length)
5. 반환 타입: { bandCount: number; practiceCount: number; performanceCount: number; sessionCount: number; isLoading: boolean }
6. 로딩/에러 상태 병합: isLoading = 모든 쿼리가 로딩 중, isError = 하나라도 에러
7. staleTime 설정으로 불필요한 재요청 방지

### 6.4. Home 페이지 레이아웃 재구성 (page.tsx)

**Status:** done  
**Dependencies:** 6.1, 6.2, 6.3  

src/app/(main)/home/page.tsx를 디자인 원본 기준으로 재구성한다. 인사말 헤더, 4열 StatCard 그리드, 2열 섹션 그리드, 3열 공연 그리드를 구현한다.

**Details:**

1. PageTitle을 인사말 형식으로 변경: title='안녕하세요, {name}님', description='오늘도 좋은 합주 되세요.'
2. useMe 훅으로 현재 사용자 이름 가져오기
3. StatCard 그리드 섹션 추가:
   - grid grid-cols-2 md:grid-cols-4 gap-4
   - StatCard x4: 소속 밴드(band/accent), 예정 합주(practice/success), 예정 공연(performance/amber), 참여 세션(music/warn)
4. 내 밴드 + 다가오는 합주 2열 그리드:
   - grid grid-cols-1 lg:grid-cols-2 gap-6
   - 각 섹션에 SectionTitle(action='전체 보기 →' Link) + 기존 MyBands/UpcomingPractices 컴포넌트
5. 다가오는 공연 3열 그리드:
   - SectionTitle + grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
   - UpcomingPerformances limit 조정
6. 반응형 스택: 모바일에서 모든 그리드 단일 컬럼

### 6.5. Topbar 연동 및 반응형 테스트

**Status:** done  
**Dependencies:** 6.4  

데스크톱에서 Topbar에 '홈' 타이틀이 표시되도록 연동하고, Playwright E2E 테스트로 데스크톱/모바일 양쪽 레이아웃을 검증한다.

**Details:**

1. Shell 레이아웃 시스템(Task 2)이 완료되면 Topbar 연동
   - Topbar가 아직 없으면 이 서브태스크는 Topbar props로 title 전달하는 구조만 준비
   - 현재는 PageTitle이 타이틀 역할을 대신하므로 큰 변경 불필요
2. Playwright E2E 테스트 작성 (e2e/home.spec.ts):
   - 데스크톱(1440x900) 뷰포트에서 StatCard 4열 표시 확인
   - 모바일(375x812) 뷰포트에서 StatCard 2열 표시 확인
   - 인사말 텍스트 존재 확인 ('안녕하세요' 포함)
   - 각 섹션 헤더(내 밴드, 다가오는 합주, 다가오는 공연) 존재 확인
3. 기존 home E2E 테스트가 있다면 뷰포트 파라미터 추가하여 확장
