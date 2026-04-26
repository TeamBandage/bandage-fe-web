# Task ID: 6

**Title:** 인증 가드 정합성 점검 및 AuthBootstrapper

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** 비인증 사용자가 보호된 페이지에 직접 진입한 경우 즉시 `/login`으로 리다이렉트되는지 미들웨어/클라이언트 가드 양쪽에서 검증하고, 화면 깜빡임 없이 로딩 상태를 처리하는 AuthBootstrapper를 구현한다.

**Details:**

**시나리오 검증:**
- A) refreshToken 쿠키 무 → 미들웨어에서 `/login?from=...` 리다이렉트 (현 동작 확인)
- B) refreshToken 쿠키 유 + accessToken 메모리 무 → 보호 API 401 → refresh → 성공/실패 처리
- C) 토큰 유효하나 BE 측 만료 → 401 → refresh 401 → /login + 토스트
- D) 미들웨어 통과 후 useMe 401 → AuthBootstrapper 가 redirect

**수정 대상:**

1. `src/middleware.ts` (현행 유지 확인):
   - `PROTECTED_PREFIXES` 에서 쿠키 검사 후 리다이렉트

2. `src/global/auth/AuthBootstrapper.tsx` (신규):
   ```tsx
   'use client';
   export function AuthBootstrapper({ children }: { children: ReactNode }) {
     const { data: me, isLoading, isError } = useMe();
     const router = useRouter();
     const toast = useToast();
     
     useEffect(() => {
       if (isError) {
         useAuthStore.getState().clear();
         toast.error('세션이 만료되었습니다');
         router.replace('/login');
       }
     }, [isError]);
     
     if (isLoading) return <AuthLoadingSkeleton />;
     if (isError) return null; // redirect 중
     return <>{children}</>;
   }
   ```

3. `src/app/(main)/layout.tsx` 수정:
   - 데스크톱/모바일 children 을 AuthBootstrapper 로 래핑
   - 토스트 중복 방지: apiClient 에서 401 토스트 제거, AuthBootstrapper 에서만 표시

4. `src/global/api/apiClient.ts` 수정:
   - `handleAuthFailure` 에서 토스트 호출 제거 (AuthBootstrapper 로 이관)
   - triggerUnauthorized 만 호출

**Test Strategy:**

1. 시나리오 A/B/C/D 각각 수동 테스트 (dev 환경)
2. 쿠키 삭제 후 보호 페이지 직접 진입 → /login 리다이렉트 확인
3. accessToken 만료 후 페이지 새로고침 → refresh 성공 시 정상 진입 확인
4. refresh 실패 시 토스트 "세션이 만료되었습니다" + /login 이동 확인
5. 화면 깜빡임 없이 Skeleton 표시 후 전환 확인
6. Playwright e2e 시나리오 추가 (선택)

## Subtasks

### 6.1. 미들웨어 리다이렉트 로직 검증 및 시나리오 A 확인

**Status:** pending  
**Dependencies:** None  

현행 미들웨어(`src/middleware.ts`)의 쿠키 기반 리다이렉트 동작을 검증하고, refreshToken 쿠키가 없을 때 `/login?from=...` 으로 정상 리다이렉트되는지 확인한다.

**Details:**

1. `src/middleware.ts` 의 `PROTECTED_PREFIXES` 배열과 쿠키 검사 로직이 시나리오 A를 충족하는지 코드 리뷰
2. 미들웨어가 `from` 쿼리 파라미터를 포함하여 `/login` 으로 리다이렉트하는지 확인 (현재 26-28 라인에서 구현됨)
3. 테스트 환경(dev)에서 쿠키 삭제 후 보호 페이지(`/home`, `/bands`, `/practices` 등) 직접 진입 시 리다이렉트 동작 수동 검증
4. 필요 시 미들웨어 로직 보완 (현재 구현은 정상으로 보임)
5. 검증 결과를 문서화하여 이후 subtask 에서 참조할 수 있도록 준비

### 6.2. AuthLoadingSkeleton 컴포넌트 생성

**Status:** pending  
**Dependencies:** 6.1  

인증 상태 확인 중 화면 깜빡임을 방지하기 위한 전체 화면 로딩 스켈레톤 컴포넌트를 구현한다.

**Details:**

1. `src/global/auth/AuthLoadingSkeleton.tsx` 파일 신규 생성
2. 기존 `src/components/ui/skeleton.tsx` 의 `Skeleton` 컴포넌트 활용
3. 전체 화면 영역을 커버하는 레이아웃 (min-h-screen, flex 중앙 정렬)
4. 로고 또는 앱명 텍스트 + 펄스 애니메이션 스켈레톤 바 조합
5. 접근성: role="status", aria-label="인증 확인 중" 적용
6. 다크 테마 기반 스타일링 (bg-surface, text-foreground 등 시맨틱 토큰 사용)

### 6.3. AuthBootstrapper 컴포넌트 구현

**Status:** pending  
**Dependencies:** 6.2  

useMe 쿼리 결과에 따라 로딩 스켈레톤, 에러 시 로그아웃 + 토스트 + 리다이렉트 처리를 담당하는 클라이언트 컴포넌트를 구현한다.

**Details:**

1. `src/global/auth/AuthBootstrapper.tsx` 파일 신규 생성 (`'use client'` 선언)
2. `useMe` 훅을 호출하여 `{ data, isLoading, isError }` 구조 분해
3. `isLoading` 상태일 때 `AuthLoadingSkeleton` 반환
4. `isError` 상태일 때 `useEffect` 내에서:
   - `useAuthStore.getState().clear()` 호출로 accessToken 정리
   - `useToastStore.getState().add({ type: 'error', message: '세션이 만료되었습니다' })` 호출 (훅 바깥에서 store 직접 접근)
   - `router.replace('/login')` 호출
5. 에러 상태에서는 `null` 반환 (리다이렉트 진행 중)
6. 정상 인증 시 `<>{children}</>` 반환
7. 시나리오 B/C/D 처리 대응 (apiClient 의 401 인터셉터와 연계)

### 6.4. (main) 레이아웃에 AuthBootstrapper 래핑 적용

**Status:** pending  
**Dependencies:** 6.3  

`src/app/(main)/layout.tsx` 의 데스크톱/모바일 children 을 AuthBootstrapper 로 래핑하여 보호 페이지 진입 시 인증 부트스트랩을 수행한다.

**Details:**

1. `src/app/(main)/layout.tsx` 파일 수정
2. 상단에 `import { AuthBootstrapper } from '@/global/auth/AuthBootstrapper'` 추가
3. 데스크톱 영역 `<main>` 내부의 `{children}` 을 `<AuthBootstrapper>{children}</AuthBootstrapper>` 로 래핑
4. 모바일 영역 `<Container>` 내부의 `{children}` 도 동일하게 래핑
5. 또는 두 영역을 감싸는 공통 래퍼로 AuthBootstrapper 배치 (코드 중복 최소화)
6. 기존 레이아웃 스타일링 유지 (Shell, Sidebar, BottomNav 등)

### 6.5. apiClient 401 토스트 중복 방지 및 시나리오 B/C/D 통합 테스트

**Status:** pending  
**Dependencies:** 6.4  

apiClient 의 handleAuthFailure 에서 토스트 호출이 없음을 확인하고, AuthBootstrapper 만 토스트를 표시하도록 정합성을 점검한다. 시나리오 B/C/D 를 dev 환경에서 수동 테스트한다.

**Details:**

1. `src/global/api/apiClient.ts` 의 `handleAuthFailure` 함수 검토 (현재 토스트 호출 없음 - 99-103 라인)
2. 토스트 중복 방지: AuthBootstrapper 에서만 '세션이 만료되었습니다' 토스트 표시
3. 시나리오 B 테스트: refreshToken 쿠키 유 + accessToken 메모리 무 상태에서 보호 API 호출 -> 401 -> refresh 성공 시 정상 진행 확인
4. 시나리오 C 테스트: 유효 토큰이나 BE 측 만료 -> 401 -> refresh 401 -> /login 리다이렉트 + 토스트 확인
5. 시나리오 D 테스트: 미들웨어 통과 후 useMe 401 -> AuthBootstrapper 가 /login 리다이렉트 처리 확인
6. 화면 깜빡임 없이 Skeleton 표시 후 전환되는지 시각적 확인
7. Playwright e2e 시나리오 스크립트 추가 (선택사항)
