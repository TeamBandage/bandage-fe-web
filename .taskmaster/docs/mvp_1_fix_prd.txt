<context>
# Overview — MVP 1차 디자인 보정 & 반응형 재구성

본 PRD는 Bandage 프론트엔드 **MVP 1차 릴리스(Task 1~10)의 후속 보정 작업**을 위한 것입니다. 기존 구현은 모바일 전용(바텀 네비 + 중앙 정렬 폼) 으로 완성되어 있으나, `/design/dist` 와 `/design/web/*_web.jsx` 가 정의하는 **데스크톱 마스터-디테일(Sidebar + Topbar + Pane-Split) 레이아웃**이 전혀 구현되어 있지 않습니다. 또한 일부 디자인 토큰/컴포넌트/화면 구조가 디자인 원본과 미묘하게 어긋나 있어 이를 일괄 보정합니다.

## 해결하는 문제
1. **데스크톱 레이아웃 부재** — `sm:`/`md:` 이상에서도 모바일 레이아웃이 그대로 확장되어 PC 에서 보면 바텀 네비가 하단에 떠 있고, 좌측 사이드바·마스터-디테일 구조가 없음.
2. **Auth 화면의 데스크톱 변형 부재** — `/login`, `/join`, `/password-change` 가 데스크톱에서 중앙 작은 카드로만 표시됨. 디자인은 좌측 브랜드 패널 + 우측 480px 폼 분할 구조.
3. **모바일 화면의 치수 정합성** — 최소 360px 기준에서 일부 패딩/간격/타이포 크기가 디자인 토큰(`--s-1~--s-12`, `--font-size-*`) 과 미스매치.
4. **디자인 토큰 누락** — `src/app/globals.css` 에 spacing scale, layout 변수(`--sidebar-w`, `--list-pane-w`, `--band-list-pane-w`), typography 스케일이 Tailwind v4 `@theme` 로 이식되지 않음.
5. **공용 컴포넌트 누락/불일치** — `WTopBar`, `WSidebar`, `WSectionTitle`, `WDivider`, `WStatCard`, `WRoleBadge`, `WStepIndicator`, `WPasswordStrength` 등 데스크톱 레이아웃에서 공통적으로 쓰이는 컴포넌트들이 `src/components/` 에 없음.
6. **화면별 구조 차이** — Home 의 4-통계 카드 그리드, Band/Practice/Performance 의 탭 구성·상세 레이아웃이 디자인과 구조적으로 어긋남.

## 주 사용자(영향 받는 persona)
- 기존 PRD 의 세 persona(LEADER 수연 / MEMBER 지훈 / PerformanceManager 민지) 전원이 **모바일 + 데스크톱 양쪽**에서 일관된 경험을 받아야 함.

## 가치
- 디자인-구현 drift 를 한 번에 닫고, 이후 Phase(알림/캘린더/공연 레퍼토리) 작업이 안정된 공통 레이아웃 위에서 진행되도록 함.
- Sidebar + Pane-Split 이 정착되면, 이후 데스크톱 전용 기능(드래그 편성, 멀티 셀렉트 등)이 자연스럽게 얹힘.

# Core Changes (기능 단위)

## A. 디자인 토큰 재이식 (Design Tokens Rework)
- `src/app/globals.css` 의 `@theme` 에 원본 `/design/dist/css/tokens.css` 의 **누락된 변수 전부**를 반영:
  - Spacing scale: `--spacing-s-1 ~ --spacing-s-12` (4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px) — Tailwind 의 기본 spacing scale 과 병행 가능한 semantic alias 로 노출.
  - Layout: `--sidebar-w: 240px`, `--list-pane-w: 340px`, `--band-list-pane-w: 360px` (컴포넌트 내부 `style` 또는 Tailwind arbitrary value 로 사용).
  - Typography: 디자인 원본의 헤딩(40 / 26 / 20 / 18 / 17 / 16 / 14 / 13 / 12 / 11px) 스케일을 `--text-display / --text-title-lg / --text-title / --text-subtitle / --text-body / --text-caption / --text-micro` 로 정리.
  - Role color: 기존 `--color-role-leader/admin/member` 를 `WRoleBadge` 에서 실제 소비.
  - Auth brand gradient: `linear-gradient(145deg, #0D0D1E 0%, #111128 100%)` 를 `--gradient-auth-brand` 로 등록.
- `/playground` 페이지에 모든 토큰이 시각적으로 렌더링되는 섹션을 추가하여 회귀 방지.

## B. 레이아웃 시스템 확장 (Shell / Sidebar / Topbar / Pane-Split)
- **새 공용 레이아웃 컴포넌트** (`src/components/layout/`):
  - `Shell` — `flex w-screen h-screen overflow-hidden`, children 배치 골격.
  - `Sidebar` — 데스크톱(>=960px) 에서 240px 고정 네비. `brand / section-label / nav-item(active/hover) / footer(user avatar)` 영역. 960px 미만에서는 `hidden` 처리하고 BottomNav 로 대체.
  - `Topbar` — 상세 pane 상단에 `breadcrumb + title + actions` 영역(min-height 68px). 모바일에서는 `Header` 를 유지하되 동일 props 로 통일.
  - `PaneSplit` — `flex-1 flex overflow-hidden`, `PaneList` / `PaneDetail` 두 슬롯. `PaneList` 폭은 prop `width="list" | "band-list"` 으로 선택(340 / 360px).
  - `PaneList` — `border-r` / `header(title + action)` / `body(overflow-y)` 3단.
  - `PaneDetail` — `flex-1 flex flex-col overflow-hidden` + `body padding: 24px 28px`.
- **`src/app/(main)/layout.tsx` 개편**:
  - 960px 이상: `<Shell><Sidebar/><div class="shell__main"><Topbar/>{children}</div></Shell>`.
  - 960px 미만: 기존 `BottomNav + Container` 유지.
  - 분기 방식은 **단일 컴포넌트 내부 Tailwind 클래스 분기** (`hidden lg:flex` / `lg:hidden`). 각 자식 페이지는 모바일/데스크톱 양쪽에서 재사용 가능한 구조를 갖도록 데이터 로드 단위를 server component 로 유지.
- **`src/app/(auth)/layout.tsx` 개편**:
  - 960px 이상: 좌측 `AuthBrand`(gradient + rings + logo + tagline + feature chips) + 우측 480px `AuthFormPanel`(max-w 360 inner).
  - 960px 미만: 기존 중앙 정렬 유지.
  - `AuthBrand`, `AuthFormPanel` 은 `src/components/layout/auth-split.tsx` 로 분리.

## C. 공용 컴포넌트 신규/보정 (Component Inventory Parity)
- **신규 컴포넌트** (`src/components/ui/` 또는 `src/components/layout/`):
  - `RoleBadge` (`role: 'LEADER' | 'ADMIN' | 'MEMBER'`) — `--color-role-*` 토큰 소비.
  - `SectionTitle` — `title` + optional `action`(slot) 가로 정렬.
  - `Divider` — `h-px bg-border`, optional `inset`.
  - `StatCard` — `label / value / delta?`, Home 통계 그리드에서 사용.
  - `StepIndicator` — 회원가입/비밀번호 변경 등 단계 UI.
  - `PasswordStrength` — 입력 대비 zxcvbn-lite 혹은 규칙 기반 5단계 막대.
  - `EmptyPane` — "왼쪽에서 항목을 선택하세요" 같은 pane-detail 플레이스홀더.
- **기존 컴포넌트 variant 보정**:
  - `Button`: variant = `primary | secondary | ghost | danger | accent-outline`, size = `sm | md | lg`, 내부 padding·font 토큰화.
  - `Badge`: `variant = accent | success | warn | amber | danger | muted` 로 통일. 기존 코드에서 사용 중인 variant 를 마이그레이션.
  - `Card`: `interactive` prop 을 hover 토큰(`--color-card-hover`) 과 연결, `padding` prop 을 `sm|md|lg` 로 제한.
  - `Chip`: SessionType 8종 색상 매핑을 `sessionTypeToken` 유틸로 추출(하드코딩 제거).
  - `Dialog`: 모바일 `md:` 미만에서 full-screen sheet 로 자동 전환되도록 `sheetOnMobile` 옵션 추가.
  - `BottomSheet`: 데스크톱에서는 `Dialog` 로 대체되도록 wrapper 제공(`ResponsiveSheet`).
- 모든 새로 추가/보정되는 컴포넌트는 Vitest + 스냅샷 테스트 1개 이상 동반.

## D. 모바일 반응형 재조정 (Mobile-First Audit)
- 최소 너비 **360px** 기준으로 아래 축을 전면 감사:
  - `Container` 의 horizontal padding: 모바일 16px / 태블릿 20px / 데스크톱(pane-detail) 28px.
  - Typography: `text-base` 이상 사용 지양, 본문은 `14px` 이하로 축소. `PageTitle` 은 모바일 20px / 데스크톱 26~28px 스케일.
  - Safe area: `pb-[env(safe-area-inset-bottom)]` 적용 지점 재확인 (BottomNav, Toaster 등).
  - Touch target: 모든 인터랙티브 요소 최소 40x40 보장.
- Playwright 모바일 뷰포트 프리셋 (360x780 / 414x896) 에서 각 주요 화면 스크린샷 회귀.

## E. 화면별 구조 보정 (Per-Screen Rebuild)
각 섹션은 `/design/web/*_web.jsx` 의 구조를 1차 레퍼런스로 삼아 재구성합니다. 모바일 레이아웃은 `/design/js/*.jsx` 참조.

### E1. Home (`/home`)
- **데스크톱**: `PageTitle(greeting + sub)` → `grid--4 StatCard x4 (밴드 / 합주 / 공연 / 세션)` → `grid--2 (내 밴드 list + 다가오는 합주 list)` → `col-span-full 다가오는 공연 grid--3` 구조.
- **모바일**: 단일 column, 섹션 heading + 좌우 스크롤 카드(Carousel-lite) 또는 수직 스택.
- `StatCard` 의 value 는 기존 도메인 훅 재사용(`useMyBands`, `useUpcomingPractices`, `useUpcomingPerformances`, `useSessionCount` — 훅 없으면 TanStack Query select 로 파생).

### E2. Band (`/bands`, `/bands/[bandId]`)
- **데스크톱**: `/bands` 와 `/bands/[bandId]` 를 하나의 라우트 그룹에서 마스터-디테일로 렌더. 좌측 `PaneList`(`width="band-list"`, 360px) 에 검색 + 필터 chips + 밴드 카드 목록, 우측 `PaneDetail` 에 현재 `bandId` 상세(탭: 개요 / 멤버 / 가입 신청).
- `bands` 단독 접근 시 우측 `EmptyPane` 표시.
- **모바일**: 기존대로 목록 → 상세 풀스크린 이동(라우트 push).
- 역할 가드(`RoleGuard`) 는 탭(가입 신청) 과 버튼(승인/거절/리더 위임) 에 그대로 유지.

### E3. Practice (`/practices`, `/practices/[id]`)
- **데스크톱**: 좌측 `PaneList`(340px) 에 합주 목록 + 밴드 필터 드롭다운, 우측 `PaneDetail` 에 상세.
- 상세 내부: `섹션 — 일정·장소(편집 Inline)`, `섹션 — 곡 정보 + SongRefLinkEditor`, `섹션 — 세션 grid(2~4열, 반응형)`, `섹션 — 참여자 목록`.
- **모바일**: 현재 구조 유지하되 위 섹션을 Accordion 으로 감싸 밀도 확보.

### E4. Performance (`/performances`, `/performances/[id]`)
- **데스크톱**: 좌측 `PaneList`(340px), 우측 `PaneDetail`.
- 상세: `Cover(ImgPlaceholder + title)`, `Info(밴드 chips + 일정 + 장소)`, `Performance Practices 목록 + 연결/해제 버튼`.
- **모바일**: 현재 구조 유지.

### E5. Auth (`/login`, `/join`, `/password-change`)
- **데스크톱**: `auth-split` 적용. 좌측 `AuthBrand`(logo 72x72 + title 40px + tagline + feature chips), 우측 `AuthFormPanel` 480px 고정.
- **모바일**: 기존 중앙 정렬, `AuthBrand` 는 `hidden lg:flex`.
- Join 폼에 `StepIndicator`(계정 → 프로필) 2단계 도입. 비밀번호 필드에 `PasswordStrength` 부착.

### E6. Me (`/me`)
- **데스크톱**: `PaneList`(내비 — 내 정보/비밀번호 변경/로그아웃/탈퇴) + `PaneDetail`(선택된 섹션의 폼).
- **모바일**: 기존 단일 스크롤 유지.

## F. 회귀 방지 (Regression Safety)
- Playwright E2E: 데스크톱(1440x900) + 모바일(375x812) 두 뷰포트에서 각 도메인 해피패스 1개씩 실행. 기존 E2E 에 뷰포트 파라미터 추가.
- Storybook-lite 의 역할을 하는 `/playground` 에 **컴포넌트 매트릭스** 와 **토큰 매트릭스** 섹션을 추가하여 수동 회귀.
- Lighthouse(mobile / desktop) 각 화면 성능 점수 기록(참고용, 합격선 없음).

# User Experience
- **일관된 정보 구조**: 모바일에서는 탭 네비 → 상세 push, 데스크톱에서는 마스터-디테일로 동시에 보이는 구조. 둘 다 기존 URL 과 호환(`/bands`, `/bands/[bandId]` 양쪽 그대로 유효).
- **변경 없는 플로우**: 사용자 시점의 기능(가입 / 로그인 / 밴드 생성 / 합주 편성 / 공연 연결) 은 그대로이며, 레이아웃·타이포·간격·컴포넌트만 재정렬.
- **데스크톱 전용 affordance**: `Sidebar` 의 "신규 합주 만들기" 같은 primary action 을 항상 노출, 모바일 FAB 과 동등한 역할.

## UI/UX Considerations
- **Breakpoint 통일**: 데스크톱 분기는 `lg`(Tailwind 기본 1024px) 대신 **960px 커스텀 브레이크포인트** 로 정의(디자인 원본 기준). `@theme` 에 `--breakpoint-lg: 960px` 를 오버라이드.
- **Sticky Topbar**: 데스크톱 `Topbar` 는 `sticky top-0`, 모바일 `Header` 는 기존대로 `sticky`.
- **Overflow 전략**: `pane-list__body / pane-detail__body` 는 각각 overflow-y scroll, 페이지 스크롤은 이 두 영역에서만 발생.
- **Keyboard nav**: `Sidebar` 의 nav item 들은 `role="tablist"` 대신 단순 `nav > ul > li > a` 구조 유지하되 `focus-visible` ring 적용.

</context>

<PRD>
# Technical Architecture

## Stack 유지
- Next.js 15 (App Router) + React 19 + TypeScript 5.x — 변경 없음.
- Tailwind CSS v4 `@theme` — 이번 작업에서 **토큰 확장**(spacing scale, layout vars, typography scale, breakpoint override).
- 상태/서버 상태/폼/날짜/테스트 스택은 그대로 유지.

## 새 모듈/파일 맵

```
src/
├── app/
│   ├── (auth)/layout.tsx          # auth-split 적용 (>=960px)
│   ├── (main)/layout.tsx          # Shell + Sidebar + PaneSplit (>=960px)
│   └── globals.css                # @theme 토큰 확장
├── components/
│   ├── layout/
│   │   ├── shell.tsx              # NEW: root shell wrapper
│   │   ├── sidebar.tsx            # NEW: desktop sidebar
│   │   ├── topbar.tsx             # NEW: desktop topbar
│   │   ├── pane-split.tsx         # NEW: master-detail pane container
│   │   ├── pane-list.tsx          # NEW
│   │   ├── pane-detail.tsx        # NEW
│   │   ├── auth-split.tsx         # NEW: (auth) layout split
│   │   ├── bottom-nav.tsx         # EXISTING: mobile-only 강제
│   │   ├── container.tsx          # EXISTING: padding 토큰화
│   │   ├── header.tsx             # EXISTING: topbar props 통일
│   │   └── page-title.tsx         # EXISTING: typography 토큰화
│   ├── ui/
│   │   ├── role-badge.tsx         # NEW
│   │   ├── section-title.tsx      # NEW
│   │   ├── divider.tsx            # NEW
│   │   ├── stat-card.tsx          # NEW
│   │   ├── step-indicator.tsx     # NEW
│   │   ├── password-strength.tsx  # NEW
│   │   └── responsive-sheet.tsx   # NEW: BottomSheet + Dialog wrapper
│   └── feedback/
│       └── empty-pane.tsx         # NEW
├── hooks/
│   └── useBreakpoint.ts           # NEW: SSR-safe media query hook (선택)
└── lib/
    └── session-type.ts            # NEW: SessionType -> color token
```

## 라우팅/URL 호환성
- `/bands`, `/bands/[bandId]`, `/practices`, `/practices/[id]`, `/performances`, `/performances/[id]` URL 구조 **변경 없음**.
- 데스크톱에서는 동일 URL 에서 `(main)/layout.tsx` 가 주변을 감싸 마스터-디테일을 렌더. 상세 페이지가 직접 URL 접근 가능하도록 서버 컴포넌트 유지.

## Breakpoint 정의
- Tailwind v4 `@theme` 에:
  - `--breakpoint-sm: 480px`
  - `--breakpoint-md: 768px`
  - `--breakpoint-lg: 960px`   /* 디자인 원본 데스크톱 분기 */
  - `--breakpoint-xl: 1280px`
- 컴포넌트 단에서 `lg:` 접두사로 데스크톱 분기 통일. 기존 코드에서 `md:` 로 분기한 부분이 있으면 `lg:` 로 통일.

## 데이터/API 변경
- **없음.** 기존 `domain/*/api/*` 함수 및 훅을 그대로 재사용.
- 다만 홈 `StatCard` 의 숫자 계산을 위해 TanStack Query `select` 로 파생하거나, 무한 스크롤 첫 페이지의 `total` 을 소비하는 훅 1~2개 추가 가능(백엔드 API 변경 없음).

## 마이그레이션 원칙
- **한 번에 한 도메인씩** 마이그레이션(Home → Band → Practice → Performance → Auth → Me). 각 도메인 PR 을 독립적으로 병합 가능하도록 설계.
- 공용 레이아웃(Shell/Sidebar/Topbar/PaneSplit) 은 **가장 먼저** 들어가고, 초기에는 `(main)/layout.tsx` 에서 feature-flag 처럼 env 로 on/off 가능하게 둘 필요는 없음. Tailwind 분기 하나로 충분.
- 컴포넌트 variant 보정은 **기존 사용처를 일괄 마이그레이션**한 뒤 이전 이름을 제거. deprecated alias 를 장기간 유지하지 않음.

# Development Roadmap

## Phase 1-F (Fix-Phase 1) — 토큰 & Shell
1. `globals.css` 에 누락 토큰 추가 (spacing scale / layout vars / typography scale / breakpoint override / gradient).
2. `src/components/layout/shell.tsx`, `sidebar.tsx`, `topbar.tsx`, `pane-split.tsx`, `pane-list.tsx`, `pane-detail.tsx` 구현.
3. `(main)/layout.tsx` 를 Shell 기반으로 재작성. 960px 미만에서는 기존 `BottomNav + Container` 유지.
4. `/playground` 에 토큰 + 레이아웃 스모크 섹션 추가.
5. **Exit criteria**: `pnpm dev` → 데스크톱에서 좌측 Sidebar 노출 / 모바일에서 하단 BottomNav 노출. 기존 페이지들은 일단 `PaneDetail` 안에 children 으로 끼워넣어 렌더.

## Phase 2-F — Auth 분할 레이아웃
1. `(auth)/layout.tsx` 를 `auth-split` 구조로 개편, `AuthBrand` 컴포넌트 구현.
2. Login / Join / PasswordChange 페이지 내부 폼은 그대로 두되 `AuthFormPanel` 안에 배치.
3. Join 에 `StepIndicator`, `PasswordStrength` 도입.
4. Playwright E2E: 데스크톱(1440) + 모바일(375) 각각 로그인 플로우 녹색.

## Phase 3-F — 공용 컴포넌트 보강
1. `RoleBadge`, `SectionTitle`, `Divider`, `StatCard`, `StepIndicator`, `PasswordStrength`, `EmptyPane`, `ResponsiveSheet` 구현 + 각각 테스트 1개.
2. 기존 `Button/Badge/Card/Chip/Dialog/BottomSheet` variant 를 디자인 원본과 일치시키고, 사용처 마이그레이션.
3. `/playground` 에 컴포넌트 매트릭스 섹션 업데이트.

## Phase 4-F — Home 재구성
1. `StatCard x4` grid.
2. 내 밴드 / 다가오는 합주 / 다가오는 공연 섹션을 디자인 기준으로 재정렬.
3. 모바일 한 열 스크롤, 데스크톱 grid--2 + grid--3 분기.

## Phase 5-F — Band 마스터-디테일
1. `/bands` 라우트 그룹에서 데스크톱은 `PaneSplit` 렌더, 모바일은 기존.
2. 좌측 pane: 검색 + filter chips + BandCard 목록.
3. 우측 pane: 탭(개요/멤버/가입 신청) 포함 상세.
4. `/bands/[bandId]` 단독 URL 접근도 정상 동작 보장.

## Phase 6-F — Practice 마스터-디테일
1. `/practices`, `/practices/[id]` 에 동일 패턴 적용.
2. 상세 내부를 SectionTitle + Divider + 세션 grid + 참여자 list 로 재구성.
3. `SongRefLinkEditor` 는 유지하되 inline edit UX 를 Divider 로 구분된 섹션 안으로 이동.

## Phase 7-F — Performance 마스터-디테일
1. `/performances`, `/performances/[id]` 적용.
2. Cover ImgPlaceholder + 밴드 chips + 합주 연결 목록.
3. 연결/해제 액션은 PerformanceManager 권한 체크 유지.

## Phase 8-F — Me 재구성 & 마감
1. `/me` 데스크톱 pane-split(좌측 메뉴 / 우측 상세 폼).
2. 전체 화면 한 바퀴 audit(Empty / Error / Skeleton, 접근성, 토큰 소비 일관성).
3. Playwright E2E 스위트 확장: 데스크톱+모바일 각 도메인 1개씩 총 10개 시나리오.
4. 리포트: `.taskmaster/report/mvp-1-fix-audit-YYYY-MM-DD.md` 에 시각 회귀/남은 이슈 정리.

## Out of Scope
- PWA 설치 프롬프트 / 오프라인 캐시 / 푸시 — Future Enhancements 로 재분류.
- 라이트 테마, i18n, 이미지 업로드 — 이전 PRD 그대로 유지.
- 백엔드 API 변경 없음. 타입·엔드포인트 고정.

# Logical Dependency Chain
1. **Phase 1-F 먼저(토큰 & Shell)**: 이후 모든 Phase 가 이 위에서 돌아감. 이것 없이 Auth/Home/Band 을 먼저 수정하면 중복 작업이 된다.
2. **Phase 2-F**: Auth 는 Shell 과 독립적이므로 1-F 와 병렬 가능하나 실제 배포 순서상 1-F 뒤.
3. **Phase 3-F**: Phase 4-F~7-F 에서 재사용되는 공용 컴포넌트 집합. Phase 1-F 직후에 끝내 두어야 도메인 페이지 수정이 한 번에 완료됨.
4. **Phase 4-F ~ 7-F**: 도메인별 재구성. 순서는 중요도(홈이 진입점) → 데이터 복잡도 순. 각 Phase 내부에서도 "타입(필요 시) → 컴포넌트 보정 → 페이지 레이아웃" 순서.
5. **Phase 8-F**: 마지막에 Me + 감사. 앞 단계를 그대로 재사용하므로 끝에 둔다.

# Risks and Mitigations

## 기술 리스크
- **960px 커스텀 브레이크포인트**: Tailwind v4 의 `@theme` 오버라이드가 잘 동작하는지 초기 검증 필요. → Phase 1-F 초반 `/playground` 에서 확인, 실패 시 `lg` 를 1024px 로 되돌리고 디자인 원본을 sm/md/lg 기준으로 재매핑.
- **SSR hydration mismatch**: 창 크기 기반 분기는 Tailwind 클래스(pure CSS)만 사용하여 JS `useBreakpoint` 의존 최소화. JS 훅이 필요한 경우에는 `useSyncExternalStore` 패턴 사용.
- **기존 테스트 깨짐**: Button/Badge variant 이름 변경 시 스냅샷 충돌. → PR 단위로 분리하여 각 PR 마다 `pnpm test -u` 로 스냅샷 갱신 + diff 리뷰 필수.
- **라우팅 호환성**: 데스크톱 마스터-디테일에서 `/bands` URL 로 접근했을 때 `bandId` 가 없는 경우 우측 `EmptyPane` 이 뜨도록 보장. → Phase 5-F 진입 시 E2E 로 확인.

## 디자인 리스크
- **원본 design/web 파일의 해석 차이**: `*_web.jsx` 가 실제 production React 가 아니라 레퍼런스이므로 구조가 일부 모호. → Phase 시작 시 마다 관련 파일을 원문으로 다시 읽고 (not 메모리 기반), 구조 이견은 `.taskmaster/report/<phase>-design-clarification.md` 에 기록.

## 범위 리스크
- **보정 범위 확장 유혹**: "이 참에 리팩토링" 으로 도메인 훅까지 건드리면 PR 크기가 폭발. → 각 도메인 Phase 의 작업 정의를 "layout & component" 로만 한정, 훅/타입/api 는 변경 없음.

# Appendix

## 참조
- `/design/dist/css/tokens.css` — 토큰 원본(Phase 1-F 의 bible).
- `/design/dist/css/layout.css` — Shell / Sidebar / Topbar / Pane-Split 원본 CSS.
- `/design/web/*_web.jsx` — 각 도메인 데스크톱 레퍼런스.
- `/design/js/*.jsx` — 모바일 레퍼런스.
- 기존 PRD: `.taskmaster/docs/mvp_1_prd.txt` — 본 보정 작업은 이를 대체하지 않고 **보완**함.

## 커밋/PR 컨벤션
- CLAUDE.md 의 커밋/PR 컨벤션을 그대로 따른다.
- 이번 PRD 로 파생되는 이슈 타입은 주로 `design`, `refactor`, `style`, 필요 시 `feat`.
- 각 이슈는 GitHub Project "Bandage Project" 의 `Todo` 컬럼에 자동 편입.
</PRD>
