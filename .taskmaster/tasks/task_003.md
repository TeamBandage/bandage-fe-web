# Task ID: 3

**Title:** 횡단 관심사 인프라 구축 (apiClient, 환경변수, 라우트 상수, 전역 타입)

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** API 통신 기반, 환경 변수 검증, 라우트 상수, QueryKey 상수, 공용 타입(ApiResponse, CursorResponse)을 구현합니다. 401 인터셉터와 자동 토큰 갱신 로직을 포함합니다.

**Details:**

1. src/global/config/env.ts - zod로 NEXT_PUBLIC_* 환경변수 검증:
```ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'dev', 'prod']),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
```

2. src/global/config/routes.ts - 모든 경로 상수화:
```ts
export const ROUTES = {
  LOGIN: '/login',
  JOIN: '/join',
  PASSWORD_CHANGE: '/password-change',
  HOME: '/home',
  BANDS: '/bands',
  BAND_NEW: '/bands/new',
  BAND_DETAIL: (bandId: string) => `/bands/${bandId}`,
  PRACTICES: '/practices',
  PRACTICE_NEW: '/practices/new',
  PRACTICE_DETAIL: (id: string) => `/practices/${id}`,
  PERFORMANCES: '/performances',
  PERFORMANCE_NEW: '/performances/new',
  PERFORMANCE_DETAIL: (id: string) => `/performances/${id}`,
  ME: '/me',
} as const;
```

3. src/global/config/queryKeys.ts - TanStack Query 키 팩토리:
```ts
export const queryKeys = {
  auth: { refresh: ['auth', 'refresh'] as const },
  member: { me: ['member', 'me'] as const },
  band: {
    all: ['band'] as const,
    list: () => [...queryKeys.band.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.band.all, id] as const,
    members: (id: string) => [...queryKeys.band.all, id, 'members'] as const,
    applications: (id: string, status?: string) => [...queryKeys.band.all, id, 'applications', status] as const,
  },
  // practice, performance 동일 패턴
};
```

4. src/global/types/ApiResponse.ts:
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

export type BandRole = 'LEADER' | 'ADMIN' | 'MEMBER';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'LEAVED';
export type SessionType = 'VOCAL' | 'CHORUS' | 'GUITAR' | 'BASS' | 'DRUM' | 'PERCUSSION' | 'SYNTH' | 'ETC';
```

5. src/global/error/ApiError.ts:
```ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

6. src/global/api/apiClient.ts - fetch 래퍼:
- Authorization 헤더 자동 주입 (authStore에서 accessToken 읽기)
- 401 응답 시 /auth/refresh 자동 호출 (1회 한정, 재귀 방지 플래그)
- 실패 시 authStore.clear() + /login 리다이렉트
- ApiResponse<T> 언래핑하여 data만 반환
- 실패 시 ApiError throw

7. src/global/store/authStore.ts - Zustand persist(sessionStorage):
```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clear: () => set({ accessToken: null }),
    }),
    { name: 'bandage-auth', storage: createJSONStorage(() => sessionStorage) }
  )
);
```

**Test Strategy:**

apiClient 단위 테스트: 정상 응답 언래핑, 401 응답 시 refresh 호출 및 재시도, refresh 실패 시 로그아웃 처리 시나리오 테스트

## Subtasks

### 3.1. 환경 변수 검증 및 설정 상수 구현

**Status:** pending  
**Dependencies:** None  

zod를 사용한 환경 변수 검증(env.ts), 라우트 상수(routes.ts), TanStack Query 키 팩토리(queryKeys.ts)를 구현합니다.

**Details:**

src/global/config 폴더에 세 개의 핵심 설정 파일을 생성합니다:

1. **env.ts** - zod로 NEXT_PUBLIC_* 환경 변수 검증:
   - NEXT_PUBLIC_API_BASE_URL: URL 형식 검증
   - NEXT_PUBLIC_APP_ENV: 'local' | 'dev' | 'prod' enum 검증
   - 런타임에 환경 변수가 올바르지 않으면 에러 발생

2. **routes.ts** - 모든 클라이언트 경로 상수화:
   - LOGIN, JOIN, PASSWORD_CHANGE (인증 라우트)
   - HOME, BANDS, PRACTICES, PERFORMANCES, ME (메인 라우트)
   - BAND_DETAIL, PRACTICE_DETAIL, PERFORMANCE_DETAIL (동적 라우트 함수)
   - as const 사용하여 타입 안전성 확보

3. **queryKeys.ts** - TanStack Query 키 팩토리:
   - auth, member, band, practice, performance 도메인별 키
   - 계층적 키 구조 (all, list, detail, 중첩 리소스)
   - as const로 타입 추론 최적화

### 3.2. 전역 타입 및 에러 클래스 정의

**Status:** pending  
**Dependencies:** None  

ApiResponse, CursorResponse 공용 타입과 도메인 enum 타입, ApiError 클래스를 구현합니다.

**Details:**

src/global/types와 src/global/error 폴더에 타입 및 에러 처리 기반을 구축합니다:

1. **src/global/types/api.ts** - API 공용 타입:
   - ApiResponse<T>: success, message, data, timestamp 필드
   - CursorResponse<T, C>: content, nextCursor, hasNext 필드 (무한 스크롤용)

2. **src/global/types/enums.ts** - 도메인 enum 타입:
   - BandRole: 'LEADER' | 'ADMIN' | 'MEMBER'
   - ApplicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'LEAVED'
   - SessionType: 'VOCAL' | 'CHORUS' | 'GUITAR' | 'BASS' | 'DRUM' | 'PERCUSSION' | 'SYNTH' | 'ETC'

3. **src/global/types/index.ts** - re-export barrel 파일

4. **src/global/error/ApiError.ts** - 커스텀 에러 클래스:
   - code, message, status, fieldErrors 속성
   - Error를 상속하여 instanceof 체크 가능
   - API 응답 에러를 정규화된 형태로 변환

### 3.3. Zustand authStore 구현

**Status:** pending  
**Dependencies:** None  

sessionStorage persist 미들웨어를 사용한 인증 상태 저장소(authStore)를 구현합니다.

**Details:**

src/global/store/authStore.ts에 Zustand 기반 인증 상태 관리를 구현합니다:

1. **AuthState 인터페이스**:
   - accessToken: string | null
   - setAccessToken: (token: string | null) => void
   - clear: () => void

2. **Zustand store 생성**:
   - create<AuthState>() 사용
   - persist 미들웨어로 sessionStorage에 저장
   - storage key: 'bandage-auth'
   - createJSONStorage(() => sessionStorage) 사용

3. **SSR 호환성 고려**:
   - Next.js SSR에서 sessionStorage 접근 시 에러 방지
   - 클라이언트 사이드에서만 hydration

4. **store selector 훅** (선택적):
   - useAccessToken(): 토큰만 선택
   - useIsAuthenticated(): 인증 여부 boolean 반환

### 3.4. apiClient 기본 fetch 래퍼 구현

**Status:** pending  
**Dependencies:** 3.1, 3.2, 3.3  

Authorization 헤더 자동 주입, ApiResponse 언래핑, ApiError throw 기능을 갖춘 기본 apiClient를 구현합니다.

**Details:**

src/global/api/apiClient.ts에 fetch 기반 HTTP 클라이언트를 구현합니다:

1. **기본 설정**:
   - env.NEXT_PUBLIC_API_BASE_URL을 baseURL로 사용
   - Content-Type: application/json 기본 헤더
   - credentials: 'include' (쿠키 전송용)

2. **요청 인터셉터 기능**:
   - authStore에서 accessToken 읽기
   - Authorization: Bearer {token} 헤더 자동 주입

3. **응답 처리**:
   - ApiResponse<T> 형태의 응답 언래핑 → data만 반환
   - success: false인 경우 ApiError throw
   - HTTP 상태 코드별 에러 처리

4. **HTTP 메서드 헬퍼**:
   - get<T>(url, config?): Promise<T>
   - post<T>(url, body?, config?): Promise<T>
   - patch<T>(url, body?, config?): Promise<T>
   - put<T>(url, body?, config?): Promise<T>
   - delete<T>(url, config?): Promise<T>

5. **에러 정규화**:
   - 네트워크 에러, 파싱 에러 등을 ApiError로 변환
   - fieldErrors 추출 (백엔드 검증 에러 대응)

### 3.5. 401 인터셉터 및 자동 토큰 갱신 로직 구현

**Status:** pending  
**Dependencies:** 3.4  

401 응답 시 /auth/refresh 자동 호출, 재시도 로직, 실패 시 로그아웃 처리를 구현합니다.

**Details:**

apiClient에 401 에러 처리 및 토큰 갱신 로직을 추가합니다:

1. **토큰 갱신 API 호출**:
   - POST /api/v1/auth/refresh 엔드포인트 호출
   - refreshToken은 HttpOnly 쿠키로 자동 전송
   - 성공 시 새 accessToken을 authStore에 저장

2. **401 인터셉터 로직**:
   - 401 응답 감지
   - 재귀 방지 플래그 (isRefreshing) 사용
   - /auth/refresh 요청 자체는 인터셉터 우회

3. **재시도 로직**:
   - 토큰 갱신 성공 시 원래 요청 재시도
   - 1회 한정 재시도 (무한 루프 방지)

4. **실패 처리**:
   - refresh 실패 시 authStore.clear() 호출
   - /login으로 리다이렉트 (Next.js router 사용)
   - '세션이 만료되었습니다' 토스트 표시 (차후 연동)

5. **동시 요청 처리**:
   - 여러 요청이 동시에 401을 받으면 refresh는 한 번만 호출
   - Promise queue로 대기 중인 요청들을 새 토큰으로 재시도
