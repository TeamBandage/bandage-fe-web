# Task ID: 6

**Title:** 인증(Auth) 및 회원(Member) 도메인 구현

**Status:** pending

**Dependencies:** 5

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
