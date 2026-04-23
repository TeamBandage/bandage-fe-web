# Task ID: 1

**Title:** Next.js 15 프로젝트 부트스트랩 및 의존성 설치

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Next.js 15 App Router 기반 프로젝트를 생성하고, PRD에서 정의한 모든 프로덕션/개발 의존성을 설치합니다. TypeScript strict 모드, ESLint flat config, Prettier, Vitest, Playwright 설정을 완료합니다.

**Details:**

1. Next.js 프로젝트 생성:
```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

2. 프로덕션 의존성 설치:
```bash
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form zod @hookform/resolvers \
  clsx tailwind-merge date-fns date-fns-tz \
  @radix-ui/react-dialog @radix-ui/react-slot \
  @radix-ui/react-tabs @radix-ui/react-tooltip \
  @radix-ui/react-dropdown-menu lucide-react
```

3. 개발 의존성 설치:
```bash
pnpm add -D eslint @eslint/js typescript-eslint \
  eslint-config-next eslint-config-prettier \
  prettier prettier-plugin-tailwindcss \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

4. Playwright 브라우저 설치: `pnpm exec playwright install --with-deps`

5. package.json scripts 정의:
```json
{
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
```

6. tsconfig.json에 strict 모드, baseUrl: "src", paths: { "@/*": ["*"] } 설정

7. eslint.config.mjs (flat config): next/core-web-vitals + typescript-eslint + prettier 통합

8. .prettierrc 설정: semi, singleQuote, trailingComma: "all"

9. vitest.config.ts: jsdom 환경, setupFiles 설정

10. playwright.config.ts: 기본 E2E 설정

11. scripts/pre-commit 훅 생성 (lint, typecheck, format 실행)

**Test Strategy:**

pnpm dev로 개발 서버 실행 확인, pnpm build로 프로덕션 빌드 성공 확인, pnpm lint/typecheck/format:check 모두 에러 없이 통과 확인

## Subtasks

### 1.1. Next.js 15 App Router 프로젝트 생성

**Status:** pending  
**Dependencies:** None  

pnpm create next-app@latest를 사용하여 Next.js 15 App Router 기반 프로젝트를 생성합니다. TypeScript, Tailwind, App Router, src 디렉토리를 활성화하고, 기존 ESLint 설정은 비활성화합니다.

**Details:**

기존 node_modules, .git, .github, .taskmaster, design, .vscode 등 중요한 폴더/파일을 보존하면서 프로젝트를 생성해야 합니다.

명령어:
```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --yes
```

주의사항:
- 기존 .gitignore가 있으므로 덮어쓰기 시 Next.js 관련 항목(예: .next, out)이 추가되어야 함
- package.json이 새로 생성되며, 기본 scripts(dev, build, start, lint)가 포함됨
- tsconfig.json이 생성되며, 이후 strict 모드 설정 필요
- src/app 폴더 구조가 생성됨 (layout.tsx, page.tsx, globals.css)

완료 확인:
- package.json 파일 존재
- tsconfig.json 파일 존재
- src/app/layout.tsx 파일 존재
- pnpm dev 실행하여 localhost:3000 접속 확인

### 1.2. 프로덕션 및 개발 의존성 설치

**Status:** pending  
**Dependencies:** 1.1  

PRD에서 정의한 모든 프로덕션 의존성(zustand, TanStack Query, react-hook-form, zod, Radix UI 등)과 개발 의존성(ESLint, Prettier, Vitest, Playwright 등)을 설치합니다.

**Details:**

프로덕션 의존성 설치:
```bash
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools \
  react-hook-form zod @hookform/resolvers \
  clsx tailwind-merge date-fns date-fns-tz \
  @radix-ui/react-dialog @radix-ui/react-slot \
  @radix-ui/react-tabs @radix-ui/react-tooltip \
  @radix-ui/react-dropdown-menu lucide-react
```

개발 의존성 설치:
```bash
pnpm add -D eslint @eslint/js typescript-eslint \
  eslint-config-next eslint-config-prettier \
  prettier prettier-plugin-tailwindcss \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom jsdom \
  @playwright/test
```

Playwright 브라우저 설치:
```bash
pnpm exec playwright install --with-deps
```

완료 확인:
- package.json의 dependencies에 모든 프로덕션 패키지 포함
- package.json의 devDependencies에 모든 개발 패키지 포함
- pnpm why zustand (또는 다른 패키지)로 설치 확인

### 1.3. package.json scripts 및 TypeScript 설정

**Status:** pending  
**Dependencies:** 1.2  

package.json에 lint, typecheck, format, test, test:e2e 스크립트를 추가하고, tsconfig.json에 strict 모드, baseUrl, paths 설정을 적용합니다.

**Details:**

package.json scripts 업데이트:
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

tsconfig.json strict 모드 설정:
- "strict": true (이미 Next.js 기본값이지만 확인)
- "baseUrl": "src" (경로 alias 기준)
- "paths": { "@/*": ["*"] } (import alias 설정)
- "noUncheckedIndexedAccess": true (선택, 더 엄격한 타입 검사)

완료 확인:
- pnpm typecheck 실행하여 에러 없음 확인
- @/ alias로 import가 정상 동작하는지 확인

### 1.4. ESLint, Prettier, Vitest, Playwright 설정 파일 생성

**Status:** pending  
**Dependencies:** 1.3  

ESLint flat config(eslint.config.mjs), .prettierrc, .prettierignore, vitest.config.ts, playwright.config.ts 설정 파일을 생성합니다.

**Details:**

eslint.config.mjs (flat config 형식):
- next/core-web-vitals 규칙 적용
- typescript-eslint 통합
- eslint-config-prettier로 충돌 방지

.prettierrc 설정:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

.prettierignore 설정:
- node_modules, .next, out, dist 등 제외

vitest.config.ts:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

src/test/setup.ts (테스트 환경 설정 파일 생성)

playwright.config.ts:
- baseURL: 'http://localhost:3000'
- testDir: './tests/e2e'
- webServer로 next dev 자동 시작 설정

완료 확인:
- pnpm lint 실행하여 ESLint 동작 확인
- pnpm format:check 실행하여 Prettier 동작 확인
- pnpm test 실행하여 Vitest 동작 확인 (테스트 파일이 없어도 에러 없음)

### 1.5. Pre-commit 훅 생성 및 최종 빌드 검증

**Status:** pending  
**Dependencies:** 1.4  

scripts/pre-commit 훅을 생성하여 커밋 전 lint, typecheck, format을 자동 실행하도록 설정하고, 최종적으로 pnpm build가 성공하는지 검증합니다.

**Details:**

scripts/pre-commit 파일 생성:
```bash
#!/bin/sh
set -e

echo "Running lint..."
pnpm lint

echo "Running typecheck..."
pnpm typecheck

echo "Running format check..."
pnpm format:check

echo "All checks passed!"
```

실행 권한 부여:
```bash
chmod +x scripts/pre-commit
```

Git hooks 연동 (선택사항 - husky 없이 심볼릭 링크 또는 core.hooksPath 사용):
```bash
git config core.hooksPath scripts
```
또는 scripts/pre-commit을 .git/hooks/pre-commit에 심볼릭 링크

.env.local 파일 생성 (개발용 환경변수):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_ENV=local
```

.gitignore 업데이트 (필요시 .next, out 추가 확인)

최종 검증:
- pnpm lint - 에러 없음
- pnpm typecheck - 에러 없음
- pnpm format:check - 에러 없음 (또는 pnpm format으로 포맷팅 후 재확인)
- pnpm build - 프로덕션 빌드 성공
- pnpm dev - 개발 서버 실행 확인
