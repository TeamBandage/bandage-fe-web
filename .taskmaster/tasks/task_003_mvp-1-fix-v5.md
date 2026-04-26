# Task ID: 3

**Title:** 사이드바 + BottomNav — '선곡 회의' 탭 및 라우팅 추가

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** routes.ts에 SETLIST_MEETINGS 경로를 추가하고, Sidebar와 BottomNav에 '선곡 회의' 네비게이션 항목을 삽입한다.

**Details:**

## 1. routes.ts 수정
```ts
// src/global/config/routes.ts
export const ROUTES = {
  // ...existing
  SETLIST_MEETINGS: '/setlist-meetings',
  SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}`,
} as const;
```

## 2. sidebar.tsx 수정
- lucide-react에서 `ClipboardList` 아이콘 import
- mainNav 배열에 '선곡 회의' 항목 삽입 (홈 → 밴드 → **선곡 회의** → 합주 → 공연 → 마이페이지)
```ts
{ href: ROUTES.SETLIST_MEETINGS, label: '선곡 회의', icon: ClipboardList },
```
- isActive 함수에서 '/setlist-meetings' prefix 매칭

## 3. bottom-nav.tsx 수정
- tabs 배열에 동일 항목 추가 (5탭 → 6탭)
- 6탭 레이아웃: 아이콘 사이즈 `h-4 w-4`, 라벨 폰트 `text-[10px]`로 미세 조정하여 공간 확보

## 4. isActive 로직
- `href === ROUTES.SETLIST_MEETINGS` 또는 `pathname.startsWith('/setlist-meetings/')` 매칭

**Test Strategy:**

1. 데스크톱(>=960px): 사이드바에 '선곡 회의' 항목 표시, 클릭 시 /setlist-meetings 이동
2. 모바일(<960px): BottomNav에 6번째 탭 표시, 클릭 시 라우트 이동
3. /setlist-meetings/mt1 등 하위 경로에서 탭 활성 상태 유지

## Subtasks

### 3.1. routes.ts에 SETLIST_MEETINGS 경로 상수 추가

**Status:** pending  
**Dependencies:** None  

src/global/config/routes.ts에 선곡 회의 관련 경로 상수(SETLIST_MEETINGS, SETLIST_MEETING_DETAIL)를 추가하여 라우팅 시스템의 기반을 마련한다.

**Details:**

routes.ts 파일에 다음 두 경로를 추가:
- SETLIST_MEETINGS: '/setlist-meetings' (목록 페이지)
- SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}` (상세 페이지 동적 경로)

기존 PERFORMANCES와 ME 경로 사이에 삽입하여 논리적 순서 유지. AppRoutes 타입은 자동으로 추론되므로 별도 수정 불필요.

### 3.2. sidebar.tsx에 '선곡 회의' 네비게이션 항목 추가

**Status:** pending  
**Dependencies:** 3.1  

데스크톱 사이드바의 mainNav 배열에 '선곡 회의' 항목을 삽입하고 ClipboardList 아이콘을 import한다.

**Details:**

1. lucide-react import 문에 ClipboardList 추가
2. mainNav 배열에서 '밴드' 항목 다음, '합주' 항목 이전에 새 항목 삽입:
   { href: ROUTES.SETLIST_MEETINGS, label: '선곡 회의', icon: ClipboardList }
3. isActive 함수는 기존 로직이 '/setlist-meetings' prefix 매칭을 자동 처리하므로 수정 불필요 (href가 ROUTES.HOME이 아닌 경우 pathname.startsWith(`${href}/`) 패턴 사용)

### 3.3. bottom-nav.tsx에 '선곡 회의' 탭 추가 및 6탭 레이아웃 조정

**Status:** pending  
**Dependencies:** 3.1  

모바일 하단 네비게이션의 tabs 배열에 '선곡 회의' 탭을 추가하고 6탭 레이아웃에 맞게 스타일을 미세 조정한다.

**Details:**

1. lucide-react import 문에 ClipboardList 추가
2. tabs 배열에서 '밴드' 다음, '합주' 이전에 새 항목 삽입:
   { href: ROUTES.SETLIST_MEETINGS, icon: ClipboardList, label: '선곡' }
   (모바일 공간 제약으로 '선곡 회의' 대신 '선곡'으로 축약)
3. 6탭 공간 확보를 위한 스타일 조정:
   - 아이콘: className을 'h-5 w-5'에서 'h-4 w-4'로 변경
   - 라벨: className을 'text-[11px]'에서 'text-[10px]'로 변경
4. isActive 함수는 기존 로직이 prefix 매칭을 자동 처리

### 3.4. lint/typecheck 통과 및 isActive 로직 검증

**Status:** pending  
**Dependencies:** 3.2, 3.3  

변경된 파일들에 대해 lint, typecheck를 실행하고 isActive 로직이 /setlist-meetings 및 하위 경로에서 올바르게 동작하는지 확인한다.

**Details:**

1. pnpm lint 실행하여 ESLint 규칙 위반 없음 확인
2. pnpm typecheck 실행하여 TypeScript 컴파일 오류 없음 확인
3. isActive 로직 검증 포인트:
   - pathname이 '/setlist-meetings'일 때 해당 탭 활성화
   - pathname이 '/setlist-meetings/mt1', '/setlist-meetings/mt1/edit' 등 하위 경로일 때도 활성화
   - 다른 탭 경로에서는 비활성 상태 유지
4. pnpm format 실행하여 코드 포맷팅 일관성 확보
