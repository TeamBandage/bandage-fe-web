# CLAUDE.md

> **선행 지시 (모든 세션 시작 시 필수)**
>
> 이 파일을 읽기 **전에**, 반드시 워크스페이스 공통 규칙 `../CLAUDE.md` 를 **가장 먼저** 읽고 메모리에 반영한다. 커밋/PR 컨벤션, Jira/GitHub/Slack 연동, AI 생성물 스타일 규칙, API 검증 절차 등 모든 운영 규칙의 권위 있는 원본은 상위 파일이며, 본 파일은 bandage-fe 스택 specific 가이드만 보유한다. 충돌 시 상위 파일이 우선한다.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                   # Run dev server (Next.js, http://localhost:3000)
pnpm build                 # Production build
pnpm start                 # Run production build
pnpm lint                  # ESLint (must pass before commit)
pnpm typecheck             # tsc --noEmit (must pass before commit)
pnpm format                # Prettier write (must pass before commit)
pnpm test                  # Vitest (unit)
pnpm test:e2e              # Playwright (E2E)
```

A pre-commit hook at `scripts/pre-commit` runs `pnpm lint`, `pnpm typecheck`, and `pnpm format` automatically on commit.

## Architecture

Bandage 프론트엔드는 **도메인 기반 폴더 구조**의 Next.js App Router 애플리케이션입니다. 백엔드(Spring Modulith)의 도메인 경계를 그대로 미러링하여 향후 MFA(Micro-Frontend Architecture) 분리를 염두에 두고 설계합니다. Next.js 15 (App Router) + TypeScript 5.x + React 19.

## Design
/design 폴더 하위의 와이어프레임 파일 기반의 디자인을 적용
- /design/dist/README.md 를 가장 먼저 확인하고 작업 시작

### Package Layout

```
src/
├── app/                    # Next.js App Router 엔트리 (라우팅 전용, 로직 최소화)
│   ├── (auth)/             # Route Group — 로그인/회원가입 (비인증 레이아웃)
│   ├── (main)/             # Route Group — 바텀 네비 탭 레이아웃
│   │   ├── home/
│   │   ├── bands/
│   │   ├── practices/
│   │   ├── performances/
│   │   └── me/
│   ├── layout.tsx
│   └── globals.css
├── domain/                 # 핵심 비즈니스 도메인 (백엔드와 1:1 대응)
│   ├── auth/
│   ├── member/
│   ├── band/
│   ├── practice/
│   ├── practice-song/
│   └── performance/
├── components/             # 공용 UI 컴포넌트
│   ├── ui/                 # 프리미티브 (Button, Input, Dialog, BottomSheet, ...)
│   ├── layout/             # BottomNav, Header, Container
│   └── feedback/           # Toast, ErrorBoundary, Skeleton, EmptyState
├── hooks/                  # 공용 커스텀 훅 (useInfiniteCursor, useDebounce 등)
├── lib/                    # 비도메인 유틸 (cn, date, validator helpers)
└── global/                 # 횡단 관심사 (cross-cutting concerns)
    ├── api/                # fetch 클라이언트, 인터셉터, 에러 매퍼
    ├── auth/               # 토큰 저장/갱신, 가드 HOC/훅
    ├── store/              # 전역 Zustand store (authStore, uiStore)
    ├── error/              # ApiError 타입, 전역 에러 핸들러
    ├── config/             # 환경 변수, 상수 (ROUTES, QUERY_KEYS)
    └── types/              # 공용 타입 (ApiResponse, CursorResponse)
```

### Domain Module Structure

모든 도메인은 다음 레이아웃을 반드시 따릅니다. 백엔드 `domain/{name}/` 구조를 프론트에 맞게 매핑한 것입니다:

```
domain/{name}/
├── api/         # 서버 통신 함수 (백엔드의 controller/service에 대응)
├── hooks/       # 도메인 훅 (TanStack Query 래퍼, 커서 페이징 등)
├── store/       # 도메인 Zustand store (필요한 경우만)
├── components/  # 도메인 전용 UI (BandCard, PracticeSessionList 등)
├── types/       # 도메인 타입 정의 (req/res DTO 1:1 대응)
│   ├── req.ts   # 요청 DTO (백엔드 dto/req와 일치)
│   └── res.ts   # 응답 DTO (백엔드 dto/res와 일치)
└── utils/       # 도메인 전용 유틸 (역할 판정, 세션 집계 등)
```

### Key Patterns

**Server Component 우선** — 기본은 RSC. `"use client"`는 상태/이벤트/브라우저 API가 필요할 때만 최소 경계로 선언합니다. 클라이언트 컴포넌트 파일명은 `*.client.tsx`를 권장.

**API 함수** — 모든 서버 통신은 `domain/{name}/api/`의 함수를 통해서만 수행합니다. 컴포넌트에서 `fetch`를 직접 호출하지 않습니다.
```ts
// domain/band/api/createBand.ts
export async function createBand(req: CreateBandRequest): Promise<CreateBandResponse> {
  return apiClient.post('/api/v1/bands', req);
}
```

**타입 정의** — 백엔드 DTO와 타입명을 **정확히 일치**시킵니다(`BandInfoResponse`, `CreateBandRequest` 등). 응답은 `ApiResponse<T>` 래퍼를 거쳐 언래핑된 `T`만 반환합니다.
```ts
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
```

**Zustand store 분리 원칙** — 전역 상태는 `global/store/`에, 도메인 지역 상태는 `domain/{name}/store/`에 둡니다. 서버 상태(캐시 가능한 원격 데이터)는 **Zustand에 넣지 않고** TanStack Query로 관리합니다. Zustand는 클라이언트 UI 상태 전용입니다.
```ts
// global/store/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (t) => set({ accessToken: t }),
      clear: () => set({ accessToken: null }),
    }),
    { name: 'bandage-auth', storage: createJSONStorage(() => sessionStorage) },
  ),
);
```

**인증 토큰 처리** — accessToken은 메모리(Zustand) 보관, refreshToken은 HttpOnly 쿠키(백엔드 `Set-Cookie`). 401 응답 시 인터셉터가 `POST /api/v1/auth/refresh`를 자동 호출하고 실패 시 authStore 초기화 + `/login` 리다이렉트.

**폼 처리** — `react-hook-form` + `zod`. 스키마는 도메인별 `types/schema.ts`에 위치. 백엔드 검증 규칙(NotBlank, Email, Min 등)을 zod 스키마와 일치시킵니다.

**커서 페이징** — 무한 스크롤은 `useInfiniteCursor<T, C>` 공용 훅(내부적으로 `useInfiniteQuery`)을 사용. `lastId`와 `pageSize`를 관리하며, `hasNext=false`면 `fetchNextPage`를 호출하지 않습니다.

**역할 기반 UI 가드** — `global/auth/useBandRole(bandId)` 훅으로 현재 유저의 밴드 역할을 조회. `<RoleGuard role="LEADER">...</RoleGuard>` 래퍼 컴포넌트로 조건부 렌더링하거나, 버튼은 `disabled`로 처리합니다. 권한 계층: `LEADER > ADMIN > MEMBER`.

**날짜 포맷** — 모든 날짜 문자열은 `yyyy-MM-dd HH:mm` (Asia/Seoul) 고정. `lib/date.ts`의 `formatKst` / `parseKst` 헬퍼만 사용하고, 컴포넌트에서 `new Date()`를 직접 포맷하지 않습니다.

**라우팅 상수** — URL 경로는 `global/config/routes.ts`에 상수로 정의:
```ts
export const ROUTES = {
  LOGIN: '/login',
  BAND_DETAIL: (bandId: string) => `/bands/${bandId}`,
  PRACTICE_DETAIL: (id: string) => `/practices/${id}`,
} as const;
```

**에러 처리** — 모든 API 에러는 `ApiError` 클래스로 정규화. 상태 코드별 기본 UX:
- 401 → 자동 로그아웃 + 로그인 리다이렉트 + "세션이 만료되었습니다" 토스트
- 403 → 인라인 "권한이 없습니다" 메시지
- 404 → 전용 NotFound 페이지
- 400 → 필드별 인라인 메시지(백엔드 `message` 활용)
- 5xx → 전체 화면 에러 + [다시 시도] 버튼

**소프트 삭제 UX** — 삭제 액션은 항상 확인 다이얼로그 → 성공 토스트 → 목록 낙관적 업데이트(`queryClient.setQueryData`) 패턴을 따릅니다.

### Styling

**Tailwind CSS v4** — 모든 스타일은 Tailwind 유틸리티로. `globals.css`의 `@theme`에서 디자인 토큰(색/여백/반경)을 정의하고, 컴포넌트에서는 임의 값 대신 토큰 클래스만 사용합니다.

**다크 테마 기반** — `class` 전략(`<html class="dark">`). 라이트 테마는 현재 미지원(향후 확장). 색상은 `bg-surface`, `text-foreground` 같은 시맨틱 토큰으로.

**모바일 우선 반응형** — 기본 스타일은 모바일 기준으로 작성하고 `sm:`, `md:` 브레이크포인트에서 확장. 최소 지원 너비 360px.

**`cn` 유틸** — `clsx` + `tailwind-merge` 합성 유틸을 `lib/cn.ts`에 두고, 조건부 클래스 병합에 사용합니다.

**컴포넌트 프리미티브** — shadcn/ui 스타일로 `components/ui/`에 직접 구현(라이브러리 의존 최소화). 접근성(ARIA, 키보드 내비)은 Radix UI 프리미티브 위에 얹어 구현.

### Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5.x
- **Styling**: Tailwind CSS v4 + Radix UI (headless primitives)
- **State**:
  - 클라이언트 전역/지역: Zustand 5 (+ `persist` 미들웨어)
  - 서버 상태: TanStack Query 5
- **Form**: react-hook-form + zod
- **HTTP**: native `fetch` 위에 얇게 감싼 `apiClient` (인터셉터/에러 매퍼 포함)
- **Date**: date-fns + date-fns-tz (Asia/Seoul 고정)
- **Testing**: Vitest + React Testing Library, Playwright (E2E)
- **Lint/Format**: ESLint (flat config) + Prettier + TypeScript strict

### Environment

`.env.local` 필수 키:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_ENV=local   # local | dev | prod
```

`NEXT_PUBLIC_*`이 아닌 값은 서버에서만 접근하며, 클라이언트 컴포넌트에서 참조하지 않습니다.

## 운영 규칙 (workspace 공통)

커밋/PR 컨벤션, Jira/GitHub/Slack 연동, AI 스타일 규칙, API 검증 절차 등은 워크스페이스 공통 문서로 추출됨: `../CLAUDE.md` 참조. 본 파일에는 bandage-fe 스택 specific 한 가이드만 둔다.

## Task-master CLI (FE 전용)

Task-master 태스크를 실행하라는 지시를 받으면 본 절을 따른다.

`task-master` 바이너리는 nvm 관리 Node(`/Users/sunwoo/.nvm/versions/node/v20.20.2/bin/task-master`)에 설치되어 있으나 기본 쉘 `PATH` 에 없다. AI 에이전트 / 새 쉘 세션 어디서든 아래 규칙을 따른다.

- **모든 task-master 호출 앞에 `source ~/.nvm/nvm.sh && ` 를 붙여 실행**. 예:
  ```bash
  source ~/.nvm/nvm.sh && task-master list
  source ~/.nvm/nvm.sh && task-master show <id>
  source ~/.nvm/nvm.sh && task-master next
  source ~/.nvm/nvm.sh && task-master set-status --id=<id> --status=in-progress
  source ~/.nvm/nvm.sh && task-master expand --id=<id> --num=5
  source ~/.nvm/nvm.sh && task-master generate
  source ~/.nvm/nvm.sh && task-master tags use <name>
  ```
- `which task-master` 가 비어 있더라도 위 패턴으로 **항상** 호출 가능 (nvm 활성화로 PATH 확보).
- `npx task-master-ai` 는 쓰지 않는다 (항상 네트워크 의존·느림·캐시된 전역 설치를 놔두고 새로 받음).
- 전역 설치를 건드려야 할 때 외에는 `npm install -g` 로 재설치하지 않는다 (기존 0.43.1 버전 유지).

### 작업 단위(태스크) 별 커밋
- Task-master 태스크의 서브태스크(또는 논리적 작업 단위) 하나 = 커밋 하나. 여러 서브태스크 변경을 한 커밋에 몰아넣지 않는다.
- 커밋 형식은 `../CLAUDE.md` §2 참조 (Jira `[ISSUE-KEY]` prefix).

### API 연동 태스크 후 실서버 검증

도메인 API 통신 코드를 추가한 태스크(예: Task 3 · 6 · 7 · 8 · 9)는 구현 커밋 후 PR 전에 실서버 검증 절차를 수행한다. 절차 본문은 `../CLAUDE.md` §9 참조. FE 컨텍스트 보강:
- 백엔드 base URL: `http://localhost:8080`
- 프론트 호출 지점: `src/domain/<name>/api/*.ts`
- `ApiResponse<T>` 언래핑 결과까지 기록
- 보고서 위치: `.taskmaster/report/<domain>-api-verification-YYYY-MM-DD.md`



