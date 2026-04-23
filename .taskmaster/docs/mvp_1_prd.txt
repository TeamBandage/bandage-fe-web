<context>
# Overview

Bandage는 아마추어 / 세미프로 밴드의 **연습(합주)과 공연을 관리**하는 웹 서비스입니다. 본 PRD는 Bandage 프론트엔드 MVP 1차 릴리스를 위한 것으로, 백엔드(Spring Modulith)가 이미 정의된 REST API(`API_SPEC.md`)와 1:1 대응되는 Next.js 15 App Router 기반의 **모바일 우선(Mobile-First) 웹 애플리케이션**을 구축하는 것을 목표로 합니다.

- **해결하는 문제**
  - 밴드 멤버가 합주 일정, 장소, 세션 편성(보컬/기타/베이스/드럼 등)을 한 곳에서 관리하지 못해 카톡/노션/캘린더가 파편화되어 있음.
  - 공연을 준비할 때 어떤 곡을 몇 주간 합주할지, 참여 멤버가 누구인지, 세션 배정이 어떻게 되는지 가시성이 부족함.
  - 밴드 가입/탈퇴/리더 위임 같은 운영 액션이 구두로만 이루어져 히스토리가 남지 않음.
- **주 사용자(Persona)**
  - **밴드 리더(LEADER)** — 밴드를 생성하고 멤버를 승인/거절, 세션을 편성, 공연을 기획.
  - **밴드 운영진(ADMIN)** — 리더의 권한 일부를 위임받아 합주/공연을 관리.
  - **일반 멤버(MEMBER)** — 합주에 참여 의사 표시, 본인 세션 배정/해제.
- **가치**
  - "밴드 × 합주 × 공연"이라는 세 축의 데이터를 통합하여 한 화면에서 관리.
  - 모바일 네이티브 앱 수준의 UX(바텀 네비게이션 + 풀스크린 시트)를 PWA-ready한 웹으로 제공.

# Core Features

본 MVP의 핵심 기능은 백엔드 도메인(`auth / member / band / practice / practice-song / performance`)과 1:1 대응합니다.

1. **인증 (Auth)**
   - 이메일/비밀번호 로그인, accessToken은 Zustand 메모리 저장, refreshToken은 HttpOnly 쿠키.
   - 401 인터셉터 → `POST /api/v1/auth/refresh` 자동 재시도 → 실패 시 로그아웃 & `/login` 리다이렉트.
   - 비밀번호 변경, 로그아웃.
   - **왜 중요한가**: 모든 쓰기 API는 인증이 필요하므로 토큰 수명 주기가 전체 UX의 기반.
   - **동작 방식**: `apiClient`(fetch 래퍼)에서 요청/응답 인터셉터로 Authorization 헤더 주입 + 401 리커버리.

2. **회원 (Member)**
   - 회원가입(이메일·비밀번호·이름·연락처), 내 정보 조회/수정(이름·연락처), 회원 탈퇴(soft delete).
   - **왜 중요한가**: 회원가입 직후 바로 로그인 플로우에 합류할 수 있어야 함.
   - **동작 방식**: `react-hook-form + zod` 스키마로 필드 검증, 백엔드 검증 규칙(NotBlank, Email, Min)과 zod 스키마를 일치시킴.

3. **밴드 (Band)**
   - 밴드 생성/목록/단건 조회, 가입 신청/철회, 신청 목록/승인/거절(리더), 멤버 목록 조회, 리더 권한 위임, 밴드 탈퇴.
   - **왜 중요한가**: 합주/공연의 컨텍스트 단위이자 권한 계층의 근거(`LEADER > ADMIN > MEMBER`).
   - **동작 방식**: `useBandRole(bandId)` 훅으로 권한 조회 → `<RoleGuard role="LEADER">`로 조건부 렌더링.

4. **합주 (Practice)**
   - 합주 생성(제목·곡·장소·시작시각·소요시간), 상세 조회, 일정/장소 변경, 삭제.
   - 세션(파트) 생성/삭제(VOCAL / CHORUS / GUITAR / BASS / DRUM / PERCUSSION / SYNTH / ETC).
   - 합주 멤버 추가, 본인 세션 배정/해제.
   - **왜 중요한가**: 서비스의 메인 사용 시나리오. 합주 카드 한 장에서 모든 파트 편성이 보여야 함.
   - **동작 방식**: 상세 페이지는 RSC로 첫 로드, 세션 배정 같은 즉시성 액션은 TanStack Query `useMutation` + 낙관적 업데이트.

5. **합주곡 (Practice Song)**
   - 합주곡 참조 링크(YouTube 등) 업서트/삭제.
   - **왜 중요한가**: 멤버들이 합주 전에 같은 참고 레퍼런스를 공유할 수 있어야 함.
   - **동작 방식**: 합주 상세 페이지 내 "곡 정보" 섹션에 Inline Edit.

6. **공연 (Performance)**
   - 공연 생성/목록(밴드 필터)/상세 조회/수정/삭제.
   - 공연 합주 추가(신규 생성 or 기존 합주 일괄 연결), 공연 합주 연결 해제.
   - **왜 중요한가**: 공연을 목표로 여러 합주를 이정표처럼 엮는 것이 Bandage의 차별점.
   - **동작 방식**: `PerformanceManager` 권한 보유자만 수정 가능 → 버튼 단위로 비활성화.

7. **공통 UI 컴포넌트 & 횡단 관심사**
   - 바텀 네비게이션(모바일), 헤더, 컨테이너, 토스트, 에러 바운더리, 스켈레톤, 엠프티 스테이트.
   - 프리미티브(Button, Input, Select, Dialog, BottomSheet, Textarea, Avatar, Badge, Chip, Card).
   - 무한 스크롤 훅(`useInfiniteCursor<T, C>`), 디바운스 훅, 날짜 포맷 유틸(`formatKst / parseKst`).
   - **왜 중요한가**: 5개 도메인 × 평균 3개 화면을 재사용 가능한 프리미티브로 덮지 못하면 유지보수 비용이 급격히 증가.

# User Experience

## User Personas

- **밴드 리더 수연(25, 대학 밴드 동아리 회장)** — 매주 합주 편성을 직접 짬. 모바일로 이동 중에 일정 변경을 알리고 싶음.
- **일반 멤버 지훈(22, 보컬)** — 본인이 참여할 합주에 세션을 배정하고, 곡 레퍼런스를 링크로 확인.
- **공연 매니저 민지(26, 졸업생)** — 여러 밴드를 모아 조인트 공연을 기획.

## Information Architecture (IA)

```
(auth) Route Group — 비로그인 레이아웃
├── /login
├── /join
└── /password-change

(main) Route Group — 바텀 네비 레이아웃 (5탭)
├── /home                      # 홈 대시보드: 가까운 합주 / 내 밴드 / 예정 공연 요약
├── /bands                     # 밴드 목록
│   ├── /bands/new             # 밴드 생성
│   └── /bands/[bandId]        # 밴드 상세(멤버/신청 관리 탭 내장)
├── /practices                 # 합주 목록 (내 밴드 범위)
│   ├── /practices/new         # 합주 생성
│   └── /practices/[id]        # 합주 상세(세션 편성/곡 링크/일정 편집)
├── /performances              # 공연 목록
│   ├── /performances/new      # 공연 생성
│   └── /performances/[id]     # 공연 상세(합주 목록 링크)
└── /me                        # 마이페이지: 내 정보/비밀번호 변경/로그아웃/탈퇴
```

## Key User Flows

- **가입 → 밴드 입단**: 회원가입 → 자동 로그인 → `/bands`에서 밴드 검색(목록) → 상세에서 가입 신청 → 리더 승인 후 멤버로 전환.
- **합주 편성**: `/practices/new`에서 곡·일정·장소 입력 → 세션 추가(예: Guitar 2개) → 멤버 추가 → 각자 세션 배정.
- **공연 준비**: `/performances/new`에서 공연 정보 입력 + 기존 합주들 일괄 연결 → 상세에서 합주 진행 상황 트래킹.

## UI/UX Considerations

- **모바일 우선(최소 360px)**, `sm:` 이상에서는 좌측 목록 / 우측 상세의 Master-Detail로 확장(디자인 와이어프레임의 web 변형 참고).
- **다크 테마 기본** — `@theme`의 시맨틱 토큰만 사용(`bg-surface`, `text-foreground` 등).
- **낙관적 업데이트** — 세션 배정/해제, 소프트 삭제(확인 다이얼로그 → 토스트 → 목록 업데이트).
- **빈 상태 & 에러 상태 필수** — 모든 목록 페이지는 EmptyState / ErrorState / Skeleton 세 가지 상태를 반드시 제공.
- **폼 제출 중 중복 방지** — 버튼 `disabled` + 스피너.
- **날짜 표기** — 전 화면 `yyyy-MM-dd HH:mm` (KST) 고정.
</context>

<PRD>
# Technical Architecture

## Stack 확정안

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5.x (strict)
- **Package Manager**: pnpm 9+ (Node 20+)
- **Styling**: Tailwind CSS v4 (`@theme` 디자인 토큰) + Radix UI (headless primitives, 접근성용)
- **State**
  - 클라이언트 UI 상태: Zustand 5 (+ `persist` 미들웨어, `sessionStorage` 기본)
  - 서버 상태: TanStack Query 5 (`useQuery`, `useInfiniteQuery`, `useMutation`)
- **Form**: react-hook-form + zod + `@hookform/resolvers/zod`
- **HTTP**: native `fetch` 위에 얇게 감싼 `apiClient`(src/global/api)
- **Date**: date-fns + date-fns-tz (Asia/Seoul 고정)
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Lint/Format**: ESLint (flat config) + Prettier + TypeScript strict

## System Components (src/ 구조)

```
src/
├── app/
│   ├── (auth)/                   # 비인증 레이아웃
│   │   ├── login/page.tsx
│   │   ├── join/page.tsx
│   │   └── password-change/page.tsx
│   ├── (main)/                   # 바텀 네비 레이아웃
│   │   ├── layout.tsx            # <BottomNav/> + <Header/>
│   │   ├── home/page.tsx
│   │   ├── bands/
│   │   │   ├── page.tsx          # 목록
│   │   │   ├── new/page.tsx
│   │   │   └── [bandId]/page.tsx
│   │   ├── practices/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [practiceId]/page.tsx
│   │   ├── performances/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [performanceId]/page.tsx
│   │   └── me/page.tsx
│   ├── layout.tsx                # Providers (QueryClient, ThemeRoot)
│   ├── error.tsx                 # 전역 에러 바운더리
│   ├── not-found.tsx
│   └── globals.css               # @theme 토큰, Tailwind v4 엔트리
├── domain/
│   ├── auth/
│   ├── member/
│   ├── band/
│   ├── practice/
│   ├── practice-song/
│   └── performance/
├── components/
│   ├── ui/                       # Button, Input, Select, Textarea, Dialog, BottomSheet, Card, Badge, Chip, Avatar, Tabs, Skeleton
│   ├── layout/                   # BottomNav, Header, Container, PageTitle
│   └── feedback/                 # Toast, Toaster, ErrorBoundary, EmptyState, ErrorState
├── hooks/                        # useInfiniteCursor, useDebounce, useConfirmDialog
├── lib/                          # cn.ts, date.ts, validators.ts
└── global/
    ├── api/                      # apiClient.ts, interceptors.ts, errors.ts
    ├── auth/                     # useBandRole.ts, RoleGuard.tsx, authGuard.ts
    ├── store/                    # authStore.ts, uiStore.ts
    ├── error/                    # ApiError.ts, errorMapper.ts
    ├── config/                   # routes.ts, queryKeys.ts, env.ts
    └── types/                    # ApiResponse.ts, CursorResponse.ts, common enums
```

## 도메인 모듈 표준 레이아웃(모든 도메인이 동일)

```
domain/{name}/
├── api/            # 각 엔드포인트당 1개 함수. 함수명은 HTTP 액션 동사 + 리소스 (e.g. createBand, listBands, getPracticeById).
├── hooks/          # useCreateBand, useBandList (무한 스크롤), useBandDetail 등 TanStack Query 래퍼
├── store/          # 필요 시에만 (예: practice-session 편성 중인 임시 상태)
├── components/     # BandCard, BandListItem, PracticeSessionChip, PerformancePracticeRow 등
├── types/
│   ├── req.ts      # 요청 DTO (백엔드 dto/req와 일치)
│   ├── res.ts      # 응답 DTO (백엔드 dto/res와 일치)
│   └── schema.ts   # zod 스키마
└── utils/
```

## Data Models (TypeScript 표현)

백엔드 DTO와 이름을 **정확히 일치**시킵니다.

```ts
// global/types/ApiResponse.ts
export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
  timestamp: string;
};

export type CursorResponse<T, C> = {
  content: T[];
  nextCursor: C | null;
  hasNext: boolean;
};

// 공통 enum
export type BandRole = 'LEADER' | 'ADMIN' | 'MEMBER';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'LEAVED';
export type SessionType = 'VOCAL' | 'CHORUS' | 'GUITAR' | 'BASS' | 'DRUM' | 'PERCUSSION' | 'SYNTH' | 'ETC';
```

도메인별 대표 타입:
- `auth`: `LoginRequest`, `LoginResponse(accessToken)`, `RefreshResponse`, `PasswordChangeRequest`
- `member`: `JoinRequest`, `JoinResponse(id, email)`, `UpdateMeRequest`
- `band`: `CreateBandRequest`, `CreateBandResponse`, `BandInfoResponse`, `BandMemberInfoResponse`, `BandApplicationInfoResponse`
- `practice`: `CreatePracticeRequest`, `CreatePracticeResponse`, `PracticeDetailResponse`, `PracticeSessionResponse`, `PracticeParticipantResponse`, `UpdateScheduleRequest`, `UpdateVenueRequest`, `CreateSessionRequest`, `AddParticipantRequest`
- `practice-song`: `UpsertRefLinkRequest`
- `performance`: `CreatePerformanceRequest`, `CreatePerformanceResponse`, `PerformanceListResponse`, `PerformanceDetailResponse`, `UpdatePerformanceRequest`, `AddPerformancePracticeRequest`, `BatchAddPerformancePracticeRequest`, `PerformancePracticeResponse`

## APIs & Integrations

- Base URL: `NEXT_PUBLIC_API_BASE_URL`(예: `http://localhost:8080`)
- 인증: `Authorization: Bearer {accessToken}` (Zustand 메모리 저장)
- Refresh: `/api/v1/auth/refresh`는 HttpOnly 쿠키 `refreshToken` 사용, 응답으로 새 accessToken + Set-Cookie.
- 응답 언래핑: `apiClient`가 `ApiResponse<T>`에서 `data`만 반환, 실패 시 `ApiError` throw.
- 날짜 필드: `yyyy-MM-dd HH:mm` KST 문자열 그대로 송수신 — 클라이언트 내부 포맷은 `lib/date.ts`의 `formatKst/parseKst`로만 변환.

전체 엔드포인트 목록(`API_SPEC.md` 발췌):

- Auth: `POST /auth/login`, `DELETE /auth/logout`, `POST /auth/refresh`, `PATCH /auth/password`
- Member: `POST /members/join`, `GET /members/me`, `PATCH /members/me`, `DELETE /members/me`
- Band: `POST /bands`, `GET /bands/{id}`, `GET /bands`, `GET /bands/{id}/members/{memberId}`, `GET /bands/{id}/members`, `POST /bands/{id}/applications`, `GET /bands/{id}/applications`, `PATCH /bands/{id}/applications/me`, `PATCH /bands/{id}/applications/{appId}?status=`, `PATCH /bands/{id}/members/{memberId}/role`, `DELETE /bands/{id}/members/me`
- Practice: `POST /practices`, `GET /practices/{id}`, `POST /practices/{id}/sessions`, `DELETE /practices/{id}/sessions/{sessionId}`, `POST /practices/{id}/participants`, `PATCH /practices/{id}/sessions/{sessionId}/assignment`, `DELETE /practices/{id}/sessions/{sessionId}/assignment`, `PATCH /practices/{id}/schedule`, `PATCH /practices/{id}/venue`, `DELETE /practices/{id}`
- Practice Song: `PUT /practice-songs/{id}/ref-link`, `DELETE /practice-songs/{id}/ref-link`
- Performance: `POST /performances`, `GET /performances`, `GET /performances/{id}`, `PATCH /performances/{id}`, `POST /performances/{id}/practices`, `POST /performances/{id}/practices/batch`, `DELETE /performances/{id}/practices/{practiceId}`, `DELETE /performances/{id}`

## Infrastructure Requirements

- **로컬**: Node 20+, pnpm 9+. `pnpm dev`로 localhost:3000 구동.
- **환경 변수** (`.env.local`)
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
  NEXT_PUBLIC_APP_ENV=local
  ```
- **CI**: `.github/workflows/develop_ci_test.yml`이 `pnpm install --frozen-lockfile → lint → typecheck → format:check → test → build → test:e2e` 순서로 실행(이미 정의됨).
- **Pre-commit**: `scripts/pre-commit`이 `pnpm lint`, `pnpm typecheck`, `pnpm format` 자동 실행.

## 설계 원칙 (CLAUDE.md에서 강제)

- **Server Component 우선**: 페이지는 기본 RSC. `"use client"`는 상태/이벤트/브라우저 API가 필요한 최소 경계에서만 선언하며, 파일명은 `*.client.tsx`.
- **API 함수는 `domain/{name}/api/`에서만**: 컴포넌트는 직접 `fetch`를 호출하지 않음.
- **서버 상태는 Zustand에 넣지 않음**: TanStack Query의 캐시가 단일 소스.
- **역할 가드**: `<RoleGuard role="LEADER">...</RoleGuard>` 또는 버튼 `disabled`.
- **라우팅 상수**: URL은 `global/config/routes.ts`의 상수만 사용.
- **에러 매핑**: 401 → 자동 로그아웃 + 토스트, 403 → 인라인, 404 → NotFound 페이지, 400 → 필드별 인라인, 5xx → 전체 화면 에러.
- **소프트 삭제 UX**: 확인 다이얼로그 → 성공 토스트 → `queryClient.setQueryData` 낙관적 업데이트.

# Development Roadmap

본 로드맵은 **타임라인을 명시하지 않으며**, 각 Phase는 독립적으로 배포 가능한 단위(Atomic increment)로 구성됩니다. 모든 기능은 공통 컴포넌트와 도메인 레이아웃 규칙을 따릅니다.

## Phase 0 — 프로젝트 부트스트랩 (Foundation)

**목표**: 빈 디렉토리에서 `pnpm dev`가 떠서 "Hello Bandage"가 출력될 때까지.

1. **Next.js 프로젝트 생성**
   - `pnpm create next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"`
   - Tailwind v4 최신으로 업그레이드(또는 `--tailwind` 플래그가 v3 설치 시 수동 업그레이드).
2. **의존성 설치** (`pnpm add`)
   - 프로덕션: `zustand`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `zod`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `date-fns`, `date-fns-tz`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-dropdown-menu`, `lucide-react`.
   - 개발: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-next`, `eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss`, `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`.
   - `pnpm exec playwright install --with-deps`로 브라우저 바이너리 설치.
3. **tsconfig / eslint / prettier / vitest 설정 파일 작성**
   - TypeScript strict ON, `baseUrl: src`, `paths: { "@/*": ["*"] }`.
   - ESLint flat config(`eslint.config.mjs`)에 next/core-web-vitals + typescript-eslint + prettier 통합.
   - `.prettierrc`(semi, single-quote, trailing-comma all), `.prettierignore`.
   - `vitest.config.ts`(jsdom, setupFiles).
4. **`package.json` scripts 표준화**
   - `dev / build / start / lint / typecheck / format / format:check / test / test:e2e` 모두 정의.
   - `prepare: simple-git-hooks` 등 husky 대안으로 `scripts/pre-commit`에 `+x` 부여.
5. **`src/app/layout.tsx` 초기 셸**
   - `<html className="dark">`, 글로벌 토큰 로드.
   - `QueryClientProvider`, `Toaster`, `ErrorBoundary` 배치.
6. **`src/app/page.tsx`**: "Hello Bandage" 확인용.
7. **Tailwind v4 `@theme` 정의** (`globals.css`): `/design/dist/css/tokens.css`의 색상·간격·타이포 토큰을 Tailwind v4 문법으로 이식.

**Exit Criteria**: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` 모두 통과.

## Phase 1 — 횡단 관심사(Cross-cutting) & 공통 컴포넌트

**목표**: 이후 도메인 작업에서 바로 꺼내 쓸 수 있는 재사용 계층 완성.

1. **환경 변수 래퍼** `global/config/env.ts` — zod로 `NEXT_PUBLIC_*` 검증 후 export.
2. **라우트 상수** `global/config/routes.ts` — 모든 경로를 함수/상수로 정의.
3. **QueryKey 상수** `global/config/queryKeys.ts` — 도메인별 계층적 키(`['band', bandId, 'members']`).
4. **`apiClient` 구현** (`global/api/apiClient.ts`)
   - `get/post/patch/put/delete` 메서드, `Content-Type: application/json` 자동, Authorization 주입.
   - 401 인터셉터: `/auth/refresh` 1회 재시도 → 실패 시 `authStore.clear()` + `/login` redirect.
   - `ApiResponse<T>` 언래핑, 실패 시 `ApiError(code, message, status, fieldErrors?)` throw.
5. **전역 에러 매퍼** `global/error/errorMapper.ts` — `ApiError` → 토스트/인라인/리다이렉트 매핑.
6. **authStore** (`global/store/authStore.ts`) — accessToken + setter + clear + `persist`(sessionStorage).
7. **공통 훅**
   - `hooks/useInfiniteCursor<T, C>` — `useInfiniteQuery` 래퍼, `lastId`/`pageSize` 관리, `hasNext=false` 시 fetchNextPage 차단.
   - `hooks/useDebounce<T>`, `hooks/useConfirmDialog()`.
8. **`lib/cn.ts`, `lib/date.ts`(formatKst, parseKst), `lib/validators.ts`(email, phone-kr)**.
9. **UI 프리미티브** (`components/ui/`)
   - `Button`(variant: primary/secondary/ghost/danger, size: sm/md/lg, loading 지원),
   - `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`,
   - `Dialog` (Radix 기반, 모바일에선 풀스크린), `BottomSheet`,
   - `Card`, `Badge`, `Chip`, `Avatar`, `Tabs`, `Tooltip`, `DropdownMenu`,
   - `Skeleton`, `Spinner`.
10. **레이아웃 컴포넌트** (`components/layout/`): `BottomNav`(5 탭), `Header`(뒤로가기/타이틀/액션), `Container`(최대 너비 + 패딩).
11. **피드백 컴포넌트** (`components/feedback/`): `Toaster` + `toast()` API, `ErrorBoundary`, `EmptyState`, `ErrorState`.
12. **역할 가드** (`global/auth/`): `useBandRole(bandId)`, `<RoleGuard role="LEADER" fallback={null}>`, 서버용 `assertAuth()` 헬퍼.

**Exit Criteria**: 더미 스토리북 성격의 `/playground` 페이지에서 모든 UI 프리미티브 렌더링 확인(또는 Vitest 스냅샷). 빈 apiClient 단위 테스트(401 인터셉터 시나리오 1개) 통과.

## Phase 2 — 인증 / 회원 도메인 (세로 슬라이스 1)

**목표**: 가입 → 로그인 → 내 정보 조회/수정 → 비밀번호 변경 → 로그아웃 → 탈퇴까지 E2E로 동작.

1. **타입 & 스키마** (`domain/auth/types`, `domain/member/types`) — API_SPEC.md 1·2장 기준.
2. **API 함수** (`domain/auth/api`, `domain/member/api`).
3. **훅** (`useLogin`, `useLogout`, `useChangePassword`, `useRefresh`, `useJoin`, `useMe`, `useUpdateMe`, `useWithdraw`).
4. **페이지**
   - `app/(auth)/login/page.tsx` + `LoginForm.client.tsx`.
   - `app/(auth)/join/page.tsx` + `JoinForm.client.tsx`(이메일/비번/이름/연락처 zod).
   - `app/(auth)/password-change/page.tsx` + `PasswordChangeForm.client.tsx`.
   - `app/(main)/me/page.tsx` — 내 정보, 연락처 수정, 비밀번호 변경 링크, 로그아웃, 탈퇴.
5. **Auth Guard 미들웨어**: `src/middleware.ts`로 비인증 사용자 `/(main)` 접근 시 `/login` 리다이렉트 + 로그인 후 원경로 복귀.

**Exit Criteria**: Playwright로 "가입 → 로그인 → 내 정보 화면 접근" 플로우 1개 이상 녹색.

## Phase 3 — 밴드 도메인 (세로 슬라이스 2)

1. **타입 & API** — API_SPEC.md 3장 전 엔드포인트 구현.
2. **훅**
   - `useBandList` (무한 스크롤), `useBandDetail(bandId)`, `useCreateBand`.
   - `useBandMembers(bandId)` (무한), `useBandMember(bandId, bandMemberId)`.
   - `useBandApplications(bandId, status)` (무한, LEADER/ADMIN만), `useApplyBand`, `useWithdrawApplication`, `useDecideApplication`.
   - `useDelegateLeader`, `useLeaveBand`.
3. **컴포넌트**
   - `BandCard`, `BandListItem`, `BandMemberRow`, `BandApplicationRow`, `BandRoleBadge`.
4. **페이지**
   - `/bands` — 무한 스크롤 목록 + 생성 FAB.
   - `/bands/new` — 생성 폼(이름/설명/프로필).
   - `/bands/[bandId]` — 상세(Tabs: 개요 / 멤버 / 가입신청 — 권한에 따라 노출).
5. **역할 가드**: 신청 승인/거절/리더 위임/탈퇴 버튼을 `<RoleGuard>`로 래핑.

**Exit Criteria**: 생성 → 상세 조회 → 다른 계정으로 가입 신청 → 리더가 승인 → 멤버 목록에 반영 플로우 수동 확인.

## Phase 4 — 합주 도메인 + 합주곡 링크 (세로 슬라이스 3)

1. **타입 & API** — API_SPEC.md 4·5장 전 엔드포인트.
2. **훅**
   - `usePracticeDetail(practiceId)`, `useCreatePractice`, `useDeletePractice`.
   - `useUpdatePracticeSchedule`, `useUpdatePracticeVenue`.
   - `useCreateSession`, `useDeleteSession`, `useAssignSession`, `useUnassignSession`.
   - `useAddParticipant`.
   - `useUpsertSongRefLink`, `useDeleteSongRefLink`.
3. **컴포넌트**
   - `PracticeCard`, `PracticeScheduleBadge`, `PracticeVenueInline`.
   - `SessionChip`(type별 색상 토큰), `SessionRow`(배정 상태), `SessionAssignButton`.
   - `SongRefLinkEditor`.
4. **페이지**
   - `/practices` — 내 밴드 합주 목록(나중에 밴드 필터 추가할 수 있는 구조로).
   - `/practices/new` — 생성 폼(제목/곡/장소/시작/duration).
   - `/practices/[id]` — 상세: 일정/장소 편집, 세션 편성, 참여자 목록, 곡 참조 링크.
5. **세션 배정 UX**: 각 세션 카드에 "참여" 버튼 → 본인이면 "취소" 버튼 → 낙관적 업데이트.

**Exit Criteria**: 합주 생성 → 세션 3개 추가 → 2명이 각각 세션 배정 → 장소 변경 → 삭제까지 수동 확인 + 핵심 훅 단위 테스트 1~2개.

## Phase 5 — 공연 도메인 (세로 슬라이스 4)

1. **타입 & API** — API_SPEC.md 6장 전 엔드포인트.
2. **훅**
   - `usePerformanceList(bandId?)` (무한), `usePerformanceDetail(performanceId)`.
   - `useCreatePerformance`, `useUpdatePerformance`, `useDeletePerformance`.
   - `useAddPerformancePractice`, `useBatchAddPerformancePractices`, `useRemovePerformancePractice`.
3. **컴포넌트**
   - `PerformanceCard`, `PerformanceBandChips`, `PerformancePracticeRow`.
4. **페이지**
   - `/performances` — 목록(쿼리스트링 `bandId` 필터 지원).
   - `/performances/new` — 생성 폼(제목/밴드 선택(multi)/일정/장소).
   - `/performances/[id]` — 상세 + 연결된 합주 관리(기존 합주 연결 모달, 신규 합주 생성 모달).
5. **PerformanceManager 권한 체크**: 수정/삭제/합주 연결 액션을 모두 권한 가드로 래핑.

**Exit Criteria**: 공연 생성 → 기존 합주 3개 연결 → 공연 상세에서 합주 링크 → 합주 연결 해제까지 확인.

## Phase 6 — 홈 대시보드 & 마무리

1. **홈 대시보드** (`/home`)
   - "가까운 합주 3개", "내 밴드", "예정 공연 2개" 3 섹션.
   - 각 섹션은 기존 도메인 훅 재사용(별도 API 불필요).
2. **전체 화면별 Skeleton / EmptyState / ErrorState 적용 감사(audit)**.
3. **접근성 감사**: 키보드 내비, aria-label, 포커스 트랩(Dialog).
4. **Playwright E2E 확장**: 각 도메인 해피패스 1개씩 총 5개 시나리오.
5. **README 최종화 + 스크린샷**(옵션).

**Exit Criteria**: 전체 CI 그린, MVP 1차 범위의 모든 엔드포인트가 UI에서 호출됨.

## Future Enhancements (Out of Scope for MVP 1)

- 이미지 업로드(프로필/밴드 프로필) — 현재는 URL 입력만.
- 푸시 알림, 합주 참여 알림.
- 달력 뷰(월 단위 합주/공연).
- PWA 설치 프롬프트, 오프라인 캐시.
- 라이트 테마.
- i18n (현재는 ko-KR 고정).
- 공연 레퍼토리(셋리스트) 관리.

# Logical Dependency Chain

작업은 반드시 다음 의존성 체인을 따릅니다. **Foundation → Cross-cutting → 도메인 세로 슬라이스** 순서입니다.

1. **Phase 0 먼저 (Foundation)**: 프로젝트 부트스트랩 없이는 아무것도 할 수 없음. 이 단계에서 커밋 훅과 CI 워크플로우가 기대하는 scripts(`lint/typecheck/format/format:check/test/test:e2e`)를 `package.json`에 반드시 정의.
2. **Phase 1 (Cross-cutting)**: `apiClient`, `authStore`, `useInfiniteCursor`, UI 프리미티브가 없으면 이후 모든 도메인이 중복 코드로 오염됨. 이 단계에서 **공통 컴포넌트의 API 표면(props)** 을 고정.
3. **Phase 2 (Auth/Member)**: 이후 모든 도메인의 쓰기 API는 인증을 요구하므로 로그인이 먼저 동작해야 한다. `/me` 페이지를 통해 "최초로 눈에 보이는 동작하는 프론트" 지점에 도달.
4. **Phase 3 (Band)**: 합주·공연은 밴드 컨텍스트 위에서만 의미가 있음. 밴드 가입 상태가 결정돼야 합주 도메인에서 "내 밴드 범위의 합주"를 보여줄 수 있음.
5. **Phase 4 (Practice + Practice-Song)**: 공연은 합주를 연결 대상으로 삼기 때문에, 합주가 선행.
6. **Phase 5 (Performance)**: 공연 합주 연결 기능을 위해 Phase 4 필수.
7. **Phase 6 (Home + 마감)**: 앞 단계의 훅을 재사용하므로 마지막 단계에 위치.

**원자성(Atomic) & 점진적 확장**
- 각 Phase는 독립적으로 PR 단위로 쪼갤 수 있게 설계합니다(예: Phase 3을 "Band 읽기", "Band 생성/수정", "가입 신청 워크플로우" 3개 PR로).
- 공통 컴포넌트는 필요 시점에만 props를 확장하며, 처음부터 모든 케이스를 선점하지 않습니다.
- 각 도메인 PR은 "타입 → API → 훅 → 컴포넌트 → 페이지" 순서로 내부 의존성 역시 일관되게 유지합니다.

# Risks and Mitigations

## 기술적 리스크

- **Tailwind v4 초기 토큰 이식**: `/design/dist/css/tokens.css`에서 v4 `@theme`로의 변환이 까다로울 수 있음. → Phase 0에서 가장 먼저 토큰만 이식하고, `/playground`에서 시각적으로 검증.
- **Next.js 15 + React 19 호환성**: 일부 라이브러리(react-hook-form, Radix UI)가 React 19 peer 경고를 낼 수 있음. → peer 경고는 무시하고 런타임 호환성만 보장. 이슈 발생 시 canary 버전 사용.
- **401 무한 루프**: refresh 실패 시에도 인터셉터가 재귀 호출될 수 있음. → `apiClient` 내부에 "refresh 진행 중 플래그" + "재시도 1회 상한" 명시.
- **낙관적 업데이트의 롤백**: 세션 배정 실패 시 `queryClient.setQueryData` 롤백 필수. → `onMutate`에서 이전 스냅샷 저장, `onError`에서 복원.
- **서버/클라이언트 상태의 불일치**: 실수로 TanStack Query 캐시 데이터를 Zustand에 복제할 위험. → 코드 리뷰 체크리스트에 "서버 상태는 Zustand 금지" 명시.

## MVP 정의 리스크

- **스크린 수 vs 재사용 계층의 트레이드오프**: Phase 1에서 UI 프리미티브를 과도하게 추상화하면 오히려 속도가 느려짐. → 각 프리미티브는 최소 2곳에서 실제 사용된 후에만 props 추가(YAGNI).
- **권한 매트릭스 누락**: LEADER/ADMIN/MEMBER 구분이 API 엔드포인트마다 다름. → Phase 1에서 API_SPEC.md의 인증/권한 컬럼을 그대로 옮긴 매트릭스 문서를 `domain/band/docs/role-matrix.md`로 작성.

## 리소스 제약

- **디자이너 없이 개발**: 프로덕션 디자인은 `/design/dist`의 정적 HTML/CSS/JS 와이어프레임이 유일한 레퍼런스. → 토큰과 화면 컴포지션을 그대로 미러링하고, 해석 차이는 각 Phase 리뷰 시 합의.
- **백엔드 미구현 엔드포인트**: `GET /members/me`가 `Unit`을 반환(향후 구현). → 프런트는 타입만 먼저 정의하고 훅은 `enabled: false` 옵션으로 비활성화, 백엔드 구현 후 활성화.

# Appendix

## 참조 문서

- [`CLAUDE.md`](../../CLAUDE.md) — 본 프로젝트의 모든 아키텍처·컨벤션의 원본. 충돌 시 CLAUDE.md가 우선.
- [`API_SPEC.md`](../../API_SPEC.md) — 전체 엔드포인트 스펙.
- [`/design/dist/README.md`](../../design/dist/README.md) — 디자인 스타터(HTML/CSS/JS)의 구조.
- [`/design/dist/css/tokens.css`](../../design/dist/css/tokens.css) — 디자인 토큰 원본.
- [`/design/js/*.jsx`](../../design/js) — 모바일 레퍼런스 와이어프레임(React 컴포넌트 형태).
- [`/design/web/*_web.jsx`](../../design/web) — 데스크톱(Master-Detail) 레퍼런스.

## 의존성 설치 스크립트 (Phase 0에서 한 번에)

```bash
# 1. 프로젝트 생성
pnpm create next-app@latest . \
  --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*"

# 2. 프로덕션 의존성
pnpm add \
  zustand @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form zod @hookform/resolvers \
  clsx tailwind-merge \
  date-fns date-fns-tz \
  @radix-ui/react-dialog @radix-ui/react-slot \
  @radix-ui/react-tabs @radix-ui/react-tooltip \
  @radix-ui/react-dropdown-menu \
  lucide-react

# 3. 개발 의존성
pnpm add -D \
  eslint @eslint/js typescript-eslint \
  eslint-config-next eslint-config-prettier \
  prettier prettier-plugin-tailwindcss \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom \
  jsdom \
  @playwright/test

# 4. Playwright 브라우저
pnpm exec playwright install --with-deps
```

## `package.json` scripts 고정안

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## 공통 컴포넌트 인벤토리(최소 집합)

| 카테고리 | 컴포넌트 | 주요 props |
|---|---|---|
| UI | Button | variant, size, loading, asChild |
| UI | Input / Textarea / Select / Checkbox / RadioGroup | error, label, hint |
| UI | Dialog / BottomSheet | open, onOpenChange, title, footer |
| UI | Card | header, footer, padding |
| UI | Badge / Chip | variant, interactive |
| UI | Avatar | src, fallback, size |
| UI | Tabs | items, value, onChange |
| UI | Tooltip | content, side |
| UI | DropdownMenu | trigger, items |
| UI | Skeleton / Spinner | w, h, variant |
| Layout | BottomNav | active, onNavigate |
| Layout | Header | title, left, right |
| Layout | Container | maxWidth, padding |
| Feedback | Toaster + toast() | type, message, duration |
| Feedback | ErrorBoundary | fallback |
| Feedback | EmptyState / ErrorState | icon, title, description, action |

## 커밋/PR 컨벤션 (CLAUDE.md 발췌)

- 커밋 타입: `chore / feat / ai / test / refactor / fix / style / design`
- 포맷: `{type}: {summary}` + 불릿 상세 + (이슈 브랜치면) 맨 뒤 `#{issue-number}`
- PR: `.github/PULL_REQUEST_TEMPLATE.md` 준수, 모두 Markdown.
</PRD>
