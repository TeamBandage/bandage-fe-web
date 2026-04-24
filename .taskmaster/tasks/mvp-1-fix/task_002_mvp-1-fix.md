# Task ID: 2

**Title:** Shell 레이아웃 시스템 컴포넌트 구현

**Status:** done

**Dependencies:** 1 ✓

**Priority:** high

**Description:** 데스크톱 마스터-디테일 레이아웃을 위한 핵심 Shell 컴포넌트들(Shell, Sidebar, Topbar, PaneSplit, PaneList, PaneDetail)을 src/components/layout/에 구현한다.

**Details:**

1. src/components/layout/shell.tsx 구현:
   - props: children
   - flex w-screen h-screen overflow-hidden 구조

2. src/components/layout/sidebar.tsx 구현:
   - 240px 고정 너비(--sidebar-w)
   - brand 영역(로고 36x36 + 'Bandage' 타이틀)
   - nav 영역(home/bands/practices/performances 아이템, 각각 아이콘 + 라벨)
   - active 상태 스타일링(bg-accent-dim, text-accent)
   - footer 영역(user avatar + 이름 + 마이페이지 링크)
   - lg: 미만에서 hidden 처리

3. src/components/layout/topbar.tsx 구현:
   - props: title, breadcrumb?, actions?
   - min-height 68px, sticky top-0
   - breadcrumb + title 좌측, actions 슬롯 우측

4. src/components/layout/pane-split.tsx 구현:
   - flex-1 flex overflow-hidden
   - children으로 PaneList와 PaneDetail 수용

5. src/components/layout/pane-list.tsx 구현:
   - props: width?: 'list'|'band-list', header?, children
   - width='list'면 340px, 'band-list'면 360px
   - border-r, header 영역 + scrollable body

6. src/components/layout/pane-detail.tsx 구현:
   - props: children
   - flex-1, padding 24px 28px
   - overflow-y auto

**Test Strategy:**

1. 각 컴포넌트에 대해 Vitest 스냅샷 테스트 작성
2. /playground 페이지에 컴포넌트 조합 데모 섹션 추가
3. 960px 이상/미만에서 Sidebar 표시/숨김 동작 브라우저 확인

## Subtasks

### 2.1. Shell 기본 컴포넌트 구현 (shell.tsx, pane-split.tsx)

**Status:** done  
**Dependencies:** None  

데스크톱 마스터-디테일 레이아웃의 최상위 컨테이너인 Shell 컴포넌트와 좌측 목록/우측 상세 영역을 분리하는 PaneSplit 컴포넌트를 구현한다.

**Details:**

1. src/components/layout/shell.tsx 생성:
   - props: children (ReactNode)
   - Tailwind 클래스: flex w-screen h-screen overflow-hidden
   - design/dist/css/layout.css의 .shell 스펙 참조

2. src/components/layout/pane-split.tsx 생성:
   - props: children (ReactNode)
   - Tailwind 클래스: flex-1 flex overflow-hidden
   - PaneList와 PaneDetail을 children으로 수용하는 컨테이너 역할
   - design/dist/css/layout.css의 .pane-split 스펙 참조

### 2.2. PaneList 및 PaneDetail 컴포넌트 구현

**Status:** done  
**Dependencies:** 2.1  

마스터-디테일 패턴의 좌측 목록 패널(PaneList)과 우측 상세 패널(PaneDetail) 컴포넌트를 구현한다.

**Details:**

1. src/components/layout/pane-list.tsx 생성:
   - props: width ('list' | 'band-list'), header? (ReactNode), children (ReactNode)
   - width='list' → 340px (--list-pane-w), width='band-list' → 360px (--band-list-pane-w)
   - Tailwind: flex-shrink-0 border-r border-border bg-surface flex flex-col
   - header 영역: padding 20px, border-b
   - body 영역: flex-1 overflow-y-auto padding 10px 12px
   - design/dist/css/layout.css의 .pane-list, .pane-list--wide, .pane-list__header, .pane-list__body 참조

2. src/components/layout/pane-detail.tsx 생성:
   - props: children (ReactNode)
   - Tailwind: flex-1 flex flex-col overflow-hidden
   - body 영역: flex-1 overflow-y-auto padding 24px 28px
   - design/dist/css/layout.css의 .pane-detail, .pane-detail__body 참조

### 2.3. Sidebar 컴포넌트 구현

**Status:** done  
**Dependencies:** 2.1  

데스크톱 좌측 네비게이션 Sidebar 컴포넌트를 구현한다. 브랜드 영역, 네비게이션 아이템, 사용자 정보 푸터를 포함한다.

**Details:**

1. src/components/layout/sidebar.tsx 생성 ('use client' 필요 - usePathname 사용):
   - 고정 너비 240px (w-[240px] 또는 CSS 변수 --sidebar-w 활용)
   - lg: 미만에서 hidden 처리 (hidden lg:flex)

2. brand 영역 구현:
   - 로고 36x36px, border-radius rounded-md, bg-accent-dim
   - 'Bandage' 타이틀: text-xl font-black text-accent
   - 하단 border-b

3. nav 영역 구현:
   - 아이템: home, bands, practices, performances (ROUTES 상수 사용)
   - lucide-react 아이콘: Home, Users, Music, CalendarDays
   - nav-item 스타일: flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium text-foreground-sub hover:bg-card hover:text-foreground
   - active 상태: bg-accent-dim text-accent font-bold
   - usePathname 훅으로 현재 경로 판별 (BottomNav의 isActive 로직 재사용)

4. footer 영역 구현:
   - border-t, Avatar 컴포넌트 사용 (size='md')
   - 사용자 이름 표시, 마이페이지 링크 (/me)
   - 현재 인증 정보가 없으면 하드코딩 placeholder 사용 (추후 authStore 연동)

### 2.4. Topbar 컴포넌트 구현

**Status:** done  
**Dependencies:** 2.1  

페이지 상단 헤더 역할의 Topbar 컴포넌트를 구현한다. 제목, breadcrumb, 액션 버튼 슬롯을 제공한다.

**Details:**

1. src/components/layout/topbar.tsx 생성:
   - props: title (string), breadcrumb? (ReactNode), actions? (ReactNode)
   - Tailwind: flex items-center justify-between px-7 py-4.5 border-b border-border bg-surface min-h-[68px] flex-shrink-0 sticky top-0 z-10

2. 좌측 영역:
   - breadcrumb이 있으면 breadcrumb 렌더링 (text-xs text-foreground-muted mb-0.5)
   - title 렌더링 (text-lg font-bold text-foreground)
   - 두 요소를 flex flex-col로 감싸기

3. 우측 영역:
   - actions 슬롯 렌더링 (flex gap-2)
   - design/dist/css/layout.css의 .topbar, .topbar__title, .topbar__breadcrumb, .topbar__actions 참조

### 2.5. 레이아웃 컴포넌트 통합 및 barrel export 구성

**Status:** done  
**Dependencies:** 2.1, 2.2, 2.3, 2.4  

구현된 Shell 레이아웃 컴포넌트들을 통합하고, src/components/layout/index.ts에 barrel export를 구성하여 import 편의성을 높인다.

**Details:**

1. src/components/layout/index.ts 생성 또는 수정:
   - 기존 컴포넌트 export 유지: BottomNav, Container, Header, PageTitle
   - 신규 컴포넌트 추가: Shell, Sidebar, Topbar, PaneSplit, PaneList, PaneDetail
   - 명명된 export 사용 (default export 지양)

2. /playground 페이지에 Shell 레이아웃 데모 섹션 추가 (선택적):
   - Shell + Sidebar + PaneSplit(PaneList + PaneDetail) 조합 예시
   - 각 컴포넌트의 props 변형 시연
   - 반응형 동작(960px 기준) 확인용

3. 컴포넌트 상호작용 검증:
   - Shell 내부에 Sidebar + main 영역이 올바르게 배치되는지 확인
   - PaneSplit 내부에 PaneList + PaneDetail이 flex로 분리되는지 확인
   - Topbar가 sticky로 상단 고정되는지 확인
