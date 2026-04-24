# Task ID: 6

**Title:** 인증(Auth) 및 회원(Member) 도메인 구현

**Status:** pending

**Dependencies:** 5 ✓

**Priority:** high

**Description:** 로그인, 회원가입, 비밀번호 변경, 로그아웃, 회원 정보 조회/수정, 회원 탈퇴 기능을 구현합니다. Auth Guard 미들웨어로 비인증 사용자의 (main) 라우트 접근을 차단합니다.

**Details:**

1. src/domain/auth/types/req.ts:
```ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  originalPassword: string;
  newPassword: string;
}
```

2. src/domain/auth/types/res.ts:
```ts
export interface LoginResponse {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
```

3. src/domain/auth/types/schema.ts - zod 스키마 (email, password 검증)

4. src/domain/auth/api/login.ts, logout.ts, refresh.ts, changePassword.ts

5. src/domain/auth/hooks/useLogin.ts, useLogout.ts, useChangePassword.ts - useMutation 래퍼

6. src/domain/member/types/req.ts:
```ts
export interface JoinRequest {
  email: string;
  password: string;
  name: string;
  contact: string;
}

export interface UpdateMeRequest {
  name?: string;
  contact?: string;
}
```

7. src/domain/member/types/res.ts, schema.ts

8. src/domain/member/api/join.ts, getMe.ts, updateMe.ts, withdraw.ts

9. src/domain/member/hooks/useJoin.ts, useMe.ts, useUpdateMe.ts, useWithdraw.ts

10. src/app/(auth)/layout.tsx - 비인증 레이아웃 (BottomNav 없음)

11. src/app/(auth)/login/page.tsx + LoginForm.client.tsx:
- react-hook-form + zod resolver
- 로그인 성공 시 accessToken 저장 + /home 리다이렉트
- 에러 시 인라인 메시지

12. src/app/(auth)/join/page.tsx + JoinForm.client.tsx:
- 이메일/비밀번호/이름/연락처 필드
- 가입 성공 시 자동 로그인 또는 /login 리다이렉트

13. src/app/(auth)/password-change/page.tsx + PasswordChangeForm.client.tsx

14. src/app/(main)/me/page.tsx:
- 내 정보 표시 (useMe)
- 이름/연락처 수정 폼 (useUpdateMe)
- 비밀번호 변경 링크
- 로그아웃 버튼 (useLogout)
- 회원 탈퇴 버튼 (확인 다이얼로그 + useWithdraw)

15. src/middleware.ts - Auth Guard:
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refreshToken') || /* sessionStorage 대안 */;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || ...;
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/(main)/:path*'],
};
```

**Test Strategy:**

Playwright E2E: 회원가입 → 로그인 → /me 접근 → 로그아웃 → 다시 /home 접근 시 /login 리다이렉트 확인 플로우

## Subtasks

### 6.1. Auth 도메인 타입 및 API 함수 구현

**Status:** pending  
**Dependencies:** None  

src/domain/auth/ 디렉토리에 로그인, 로그아웃, 토큰 갱신, 비밀번호 변경을 위한 타입 정의(req.ts, res.ts, schema.ts)와 API 함수(login.ts, logout.ts, refresh.ts, changePassword.ts)를 구현합니다.

**Details:**

1. src/domain/auth/types/req.ts 생성:
   - LoginRequest: email(string), password(string)
   - PasswordChangeRequest: originalPassword(string), newPassword(string)

2. src/domain/auth/types/res.ts 생성:
   - LoginResponse: accessToken(string)
   - RefreshResponse: accessToken(string)

3. src/domain/auth/types/schema.ts 생성:
   - loginSchema: zod 스키마 (email: z.string().email(), password: z.string().min(8))
   - passwordChangeSchema: originalPassword, newPassword 검증

4. src/domain/auth/api/ 디렉토리에 API 함수 구현:
   - login.ts: POST /api/v1/auth/login, apiClient 사용, 성공 시 authStore.setAccessToken() 호출
   - logout.ts: POST /api/v1/auth/logout, authStore.clear() 호출
   - refresh.ts: POST /api/v1/auth/refresh (이미 apiClient에 자동 처리 로직 있음, 수동 호출용)
   - changePassword.ts: POST /api/v1/auth/password-change

5. src/domain/auth/types/index.ts에서 모든 타입 re-export

### 6.2. Member 도메인 타입, API 함수 및 훅 구현

**Status:** pending  
**Dependencies:** 6.1  

src/domain/member/ 디렉토리에 회원가입, 회원 정보 조회/수정, 회원 탈퇴를 위한 타입 정의, API 함수, TanStack Query 훅을 구현합니다.

**Details:**

1. src/domain/member/types/req.ts 생성:
   - JoinRequest: email, password, name, contact
   - UpdateMeRequest: name?(optional), contact?(optional)

2. src/domain/member/types/res.ts 생성:
   - MemberInfoResponse: id, email, name, contact, createdAt
   - JoinResponse: accessToken (자동 로그인용)

3. src/domain/member/types/schema.ts 생성:
   - joinSchema: 모든 필드 검증 (email, password.min(8), name.min(2), contact 패턴)
   - updateMeSchema: 선택적 필드 검증

4. src/domain/member/api/ 디렉토리에 API 함수 구현:
   - join.ts: POST /api/v1/members/join, 성공 시 authStore.setAccessToken() 호출
   - getMe.ts: GET /api/v1/members/me
   - updateMe.ts: PATCH /api/v1/members/me
   - withdraw.ts: DELETE /api/v1/members/me, authStore.clear() 호출

5. src/domain/member/hooks/ 디렉토리에 TanStack Query 훅 구현:
   - useMe.ts: useQuery 래퍼, queryKeys.member.me 사용
   - useJoin.ts: useMutation 래퍼
   - useUpdateMe.ts: useMutation 래퍼, 성공 시 queryClient.invalidateQueries()
   - useWithdraw.ts: useMutation 래퍼

### 6.3. (auth) 라우트 그룹 및 로그인/회원가입 페이지 구현

**Status:** pending  
**Dependencies:** 6.1, 6.2  

src/app/(auth)/ 라우트 그룹을 생성하고, 비인증 레이아웃(BottomNav 없음)과 로그인(login), 회원가입(join) 페이지 및 폼 컴포넌트를 구현합니다.

**Details:**

1. src/app/(auth)/layout.tsx 생성:
   - BottomNav 없는 심플한 레이아웃
   - 다크 테마 배경, 중앙 정렬 컨테이너
   - 이미 인증된 사용자는 /home으로 리다이렉트 (useIsAuthenticated 체크)

2. src/app/(auth)/login/page.tsx 생성:
   - RSC 페이지, 메타데이터(title: '로그인')
   - LoginForm.client.tsx 임포트

3. src/app/(auth)/login/LoginForm.client.tsx 생성:
   - 'use client' 선언
   - react-hook-form + zodResolver(loginSchema) 사용
   - Input 컴포넌트로 email, password 필드
   - Button 컴포넌트로 제출 (loading 상태 처리)
   - 로그인 성공 시 router.push(ROUTES.HOME)
   - 에러 시 useToast().error() 호출 및 필드별 인라인 메시지
   - '회원가입' 링크 → ROUTES.JOIN

4. src/app/(auth)/join/page.tsx 생성:
   - RSC 페이지, 메타데이터(title: '회원가입')

5. src/app/(auth)/join/JoinForm.client.tsx 생성:
   - email, password, name, contact 4개 필드
   - useJoin 훅 사용
   - 가입 성공 시 자동 로그인 후 router.push(ROUTES.HOME)
   - '로그인' 링크 → ROUTES.LOGIN

### 6.4. 비밀번호 변경 페이지 및 마이페이지(/me) 구현

**Status:** pending  
**Dependencies:** 6.2, 6.3  

비밀번호 변경 페이지(password-change)와 마이페이지(/me)를 구현합니다. 마이페이지에서 회원 정보 표시, 수정, 로그아웃, 회원 탈퇴 기능을 제공합니다.

**Details:**

1. src/app/(auth)/password-change/page.tsx 생성:
   - RSC 페이지, 메타데이터(title: '비밀번호 변경')

2. src/app/(auth)/password-change/PasswordChangeForm.client.tsx 생성:
   - originalPassword, newPassword, confirmPassword 3개 필드
   - passwordChangeSchema로 검증 (newPassword === confirmPassword 커스텀 검증)
   - useChangePassword 훅 사용 (domain/auth/hooks/useChangePassword.ts 필요시 추가)
   - 성공 시 toast.success() + router.push(ROUTES.ME)

3. src/app/(main)/me/page.tsx 구현 (기존 플레이스홀더 교체):
   - RSC 페이지, Suspense로 MeContent.client.tsx 래핑
   - Skeleton 로딩 상태 표시

4. src/app/(main)/me/MeContent.client.tsx 생성:
   - useMe 훅으로 회원 정보 조회
   - 이름/연락처 표시 (수정 버튼 → UpdateMeForm 모달 또는 인라인)
   - useUpdateMe로 정보 수정
   - 비밀번호 변경 링크 → ROUTES.PASSWORD_CHANGE
   - 로그아웃 버튼: useLogout 훅 → authStore.clear() → router.push(ROUTES.LOGIN)
   - 회원 탈퇴 버튼: Dialog 확인 → useWithdraw → router.push(ROUTES.LOGIN)

5. src/domain/auth/hooks/useLogout.ts, useChangePassword.ts 추가:
   - useMutation 래퍼, 성공/실패 시 토스트 및 리다이렉트 처리

### 6.5. Auth Guard 미들웨어 및 E2E 테스트 구현

**Status:** pending  
**Dependencies:** 6.3, 6.4  

Next.js 미들웨어로 비인증 사용자의 (main) 라우트 접근을 차단하고 /login으로 리다이렉트합니다. Playwright E2E 테스트로 전체 인증 플로우를 검증합니다.

**Details:**

1. src/middleware.ts 생성:
   - NextRequest에서 refreshToken 쿠키 확인 (HttpOnly이므로 서버에서 접근 가능)
   - matcher: ['/(main)/:path*']로 (main) 라우트 그룹만 보호
   - 토큰 없으면 NextResponse.redirect(new URL('/login', request.url))
   - 토큰 있으면 NextResponse.next()
   - /login, /join 등 인증 페이지는 matcher에서 제외

2. 클라이언트 측 보조 가드 (선택적):
   - src/global/auth/AuthGuard.tsx 컴포넌트 또는 useAuthGuard 훅
   - useIsAuthenticated() + useEffect로 클라이언트 측 리다이렉트
   - 미들웨어가 커버하지 못하는 엣지 케이스 대응

3. Playwright E2E 테스트 작성 (e2e/auth.spec.ts):
   - 시나리오 1: 비인증 사용자가 /home 접근 시 /login으로 리다이렉트
   - 시나리오 2: 회원가입 → 자동 로그인 → /home 접근 성공
   - 시나리오 3: 로그인 → /me 접근 → 회원 정보 표시 확인
   - 시나리오 4: 로그아웃 → /home 접근 시 /login 리다이렉트
   - 시나리오 5: 잘못된 로그인 정보 입력 시 에러 메시지 표시

4. 테스트 유틸리티:
   - e2e/fixtures/auth.ts: 테스트용 로그인/회원가입 헬퍼 함수
   - Mock API 또는 테스트 계정 활용
