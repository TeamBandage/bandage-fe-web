# Bandage FE

밴드 연습/공연 관리 서비스 **Bandage**의 프론트엔드 웹 애플리케이션입니다. 백엔드(Spring Modulith)의 도메인 경계를 프론트에 1:1로 미러링한 **도메인 기반 폴더 구조**로 설계되어, 향후 MFA(Micro-Frontend Architecture) 분리를 염두에 두고 확장 가능합니다.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5.x
- **Styling**: Tailwind CSS v4 + Radix UI (headless primitives)
- **State**:
  - 클라이언트: Zustand 5 (+ `persist` 미들웨어)
  - 서버: TanStack Query 5
- **Form**: react-hook-form + zod
- **HTTP**: native `fetch` 기반 경량 `apiClient` (인터셉터/에러 매퍼 내장)
- **Date**: date-fns + date-fns-tz (Asia/Seoul 고정)
- **Testing**: Vitest + React Testing Library, Playwright (E2E)
- **Lint/Format**: ESLint (flat config) + Prettier + TypeScript strict

## Getting Started

### Prerequisites

- Node.js 20 이상
- pnpm 9 이상

### Install

```bash
pnpm install
```

### Environment

프로젝트 루트에 `.env.local`을 생성하고 다음 키를 정의합니다:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_ENV=local   # local | dev | prod
```

> `NEXT_PUBLIC_*`이 아닌 값은 서버에서만 접근하며, 클라이언트 컴포넌트에서 참조하지 않습니다.

### Run Dev Server

```bash
pnpm dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## Scripts

```bash
pnpm dev            # 개발 서버 실행 (http://localhost:3000)
pnpm build          # 프로덕션 빌드
pnpm start          # 프로덕션 빌드 실행
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier write (로컬 커밋 전 자동 포맷)
pnpm format:check   # Prettier check (CI/검증 전용)
pnpm test           # Vitest (unit)
pnpm test:e2e       # Playwright (E2E)
```

커밋 전 `pnpm lint`, `pnpm typecheck`, `pnpm format`이 반드시 통과해야 합니다. `scripts/pre-commit` 훅이 이를 자동 실행합니다.

## Project Structure

```
src/
├── app/         # Next.js App Router 엔트리 (라우팅 전용)
├── domain/      # 핵심 비즈니스 도메인 (백엔드와 1:1 대응)
├── components/  # 공용 UI 컴포넌트 (ui / layout / feedback)
├── hooks/       # 공용 커스텀 훅
├── lib/         # 비도메인 유틸 (cn, date, validator)
└── global/      # 횡단 관심사 (api / auth / store / error / config / types)
```

각 도메인 모듈은 다음 레이아웃을 따릅니다:

```
domain/{name}/
├── api/         # 서버 통신 함수
├── hooks/       # TanStack Query 래퍼, 커서 페이징 등
├── store/       # 도메인 Zustand store (필요한 경우만)
├── components/  # 도메인 전용 UI
├── types/       # req/res DTO 타입 (백엔드와 정확히 일치)
└── utils/       # 도메인 전용 유틸
```

자세한 설계 원칙(Server Component 우선, 인증 토큰 처리, 에러 처리 UX, 스타일 규칙 등)은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## Design

디자인은 [`/design`](./design) 폴더 하위의 와이어프레임 파일을 기준으로 합니다. 작업 시작 전 [`/design/dist/README.md`](./design/dist/README.md)를 먼저 확인하세요.

## Conventions

### Commit Message

```
{type}: {summary}
- {detail 1}
- {detail 2}

#{issue-number}
```

**Types**: `chore`, `feat`, `ai`, `test`, `refactor`, `fix`, `style`, `design`

- 이슈 브랜치(예: `feat/#12-band-create-page`)에서 작업할 때 `#{issue-number}`는 **필수**이며, 본문과 한 줄 공백을 두고 맨 마지막에 배치합니다.

**Example:**

```
feat: 밴드 생성 페이지 구현
- CreateBandRequest, CreateBandResponse 타입 추가
- domain/band/api/createBand.ts 함수 추가
- app/(main)/bands/new/page.tsx 라우트 추가

#12
```

### Pull Request

PR 설명은 [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md)를 따릅니다.

### Issue

이슈 작성 시 `.github/ISSUE_TEMPLATE/`의 템플릿 중 유형에 맞는 것을 선택합니다: feature / fix / chore / refactor / test / ai / style / design.
