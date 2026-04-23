# Task ID: 5

**Title:** 레이아웃 컴포넌트 및 피드백 시스템 구축

**Status:** done

**Dependencies:** 3 ✓, 4 ✓

**Priority:** high

**Description:** BottomNav(5탭), Header, Container 레이아웃 컴포넌트와 Toast, ErrorBoundary, EmptyState, ErrorState 피드백 컴포넌트를 구현합니다. 공통 훅(useInfiniteCursor, useDebounce, useConfirmDialog)과 날짜 유틸도 포함합니다.

**Details:**

1. src/components/layout/bottom-nav.tsx:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Music, CalendarDays, User } from 'lucide-react';
import { ROUTES } from '@/global/config/routes';

const tabs = [
  { href: ROUTES.HOME, icon: Home, label: '홈' },
  { href: ROUTES.BANDS, icon: Users, label: '밴드' },
  { href: ROUTES.PRACTICES, icon: Music, label: '합주' },
  { href: ROUTES.PERFORMANCES, icon: CalendarDays, label: '공연' },
  { href: ROUTES.ME, icon: User, label: 'MY' },
];

export function BottomNav() {
  const pathname = usePathname();
  // 탭별 active 상태 판정 및 렌더링
}
```

2. src/components/layout/header.tsx - title, left(뒤로가기 등), right(액션 버튼) props

3. src/components/layout/container.tsx - maxWidth, padding props

4. src/components/layout/page-title.tsx - 페이지 제목 표시용

5. src/components/feedback/toast.tsx + toaster.tsx:
- Radix Toast 또는 커스텀 구현
- toast({ type: 'success' | 'error' | 'info', message, duration }) API
- 전역 Toaster 컴포넌트

6. src/components/feedback/error-boundary.tsx - React ErrorBoundary, fallback prop

7. src/components/feedback/empty-state.tsx - icon, title, description, action props

8. src/components/feedback/error-state.tsx - 재시도 버튼 포함

9. src/hooks/useInfiniteCursor.ts:
```ts
import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { CursorResponse } from '@/global/types/ApiResponse';

export function useInfiniteCursor<T, C>(
  queryKey: unknown[],
  fetcher: (params: { lastId?: C; pageSize: number }) => Promise<CursorResponse<T, C>>,
  pageSize = 10,
  options?: Omit<UseInfiniteQueryOptions, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetcher({ lastId: pageParam as C | undefined, pageSize }),
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as C | undefined,
    ...options,
  });
}
```

10. src/hooks/useDebounce.ts - 값 디바운싱 훅

11. src/hooks/useConfirmDialog.ts - 확인 다이얼로그 상태 관리 훅

12. src/lib/date.ts:
```ts
import { format, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const KST = 'Asia/Seoul';
const FORMAT = 'yyyy-MM-dd HH:mm';

export function formatKst(date: Date): string {
  return format(toZonedTime(date, KST), FORMAT);
}

export function parseKst(dateString: string): Date {
  return fromZonedTime(parse(dateString, FORMAT, new Date()), KST);
}
```

13. src/app/(main)/layout.tsx - BottomNav + Header + Container 적용

14. src/app/layout.tsx - QueryClientProvider, Toaster, 전역 ErrorBoundary 설정

**Test Strategy:**

BottomNav 탭 전환 시 active 상태 변경 확인, Toast 표시/자동 닫힘 동작 확인, useInfiniteCursor mock 데이터로 페이지네이션 로직 단위 테스트

## Subtasks

### 5.1. Toast 시스템 구현 (Store + 컴포넌트 + 훅)

**Status:** pending  
**Dependencies:** None  

전역 알림을 위한 Toast 시스템을 구현합니다. Zustand 기반 toastStore, Toast UI 컴포넌트, useToast 훅, 그리고 전역 Toaster 컴포넌트를 포함합니다.

**Details:**

1. src/global/store/toastStore.ts - Zustand store 생성:
   - ToastType: 'success' | 'error' | 'info' | 'warn'
   - Toast 인터페이스: { id, type, message, duration }
   - add, remove, clear 액션
   - 최대 3개 토스트 제한 로직

2. src/components/feedback/toast.tsx - 개별 Toast 컴포넌트:
   - 타입별 아이콘 및 색상 (success=green, error=red, info=blue, warn=yellow)
   - lucide-react 아이콘 사용 (CheckCircle, XCircle, Info, AlertTriangle)
   - 닫기 버튼 포함
   - animate-toast-in 애니메이션 적용

3. src/components/feedback/toaster.tsx - 전역 Toaster 컨테이너:
   - toastStore 구독
   - 모바일: bottom-center, 데스크탑: bottom-right 포지셔닝
   - z-index: 9999

4. src/hooks/useToast.ts - 편의 훅:
   - success(message, duration?), error(...), info(...), warn(...) 메서드
   - 기본 duration: 3000ms

5. src/app/layout.tsx에 Toaster 컴포넌트 추가

### 5.2. 레이아웃 컴포넌트 구현 (BottomNav, Header, Container)

**Status:** pending  
**Dependencies:** None  

앱 전체에서 사용할 레이아웃 컴포넌트들을 구현합니다. 5탭 BottomNav, 유연한 Header, 그리고 콘텐츠 래퍼 Container를 포함합니다.

**Details:**

1. src/components/layout/bottom-nav.tsx:
   - 5개 탭: 홈(Home), 밴드(Users), 합주(Music), 공연(CalendarDays), MY(User)
   - usePathname()으로 현재 경로 감지
   - ROUTES 상수 사용 (global/config/routes.ts)
   - active 상태: accent 색상, inactive: foreground-muted
   - fixed bottom-0, safe-area-inset-bottom 적용
   - bg-surface border-t border-border

2. src/components/layout/header.tsx:
   - Props: title (string | ReactNode), left?, right?, className?
   - left: 기본 뒤로가기 버튼 (ChevronLeft 아이콘)
   - right: 액션 버튼 슬롯
   - sticky top-0, bg-surface/95 backdrop-blur
   - h-14, px-4 기본 스타일

3. src/components/layout/container.tsx:
   - Props: maxWidth?, padding?, className?, children
   - maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' (기본: 'lg')
   - padding: boolean (기본: true, px-4)
   - mx-auto 중앙 정렬

4. src/components/layout/page-title.tsx:
   - Props: title, description?, action?
   - text-xl font-bold text-foreground
   - description: text-foreground-sub

### 5.3. 피드백 컴포넌트 구현 (ErrorBoundary, EmptyState, ErrorState)

**Status:** pending  
**Dependencies:** 5.1  

에러 처리와 빈 상태를 위한 피드백 컴포넌트들을 구현합니다. React ErrorBoundary, 빈 목록 표시용 EmptyState, 에러 발생 시 표시할 ErrorState를 포함합니다.

**Details:**

1. src/components/feedback/error-boundary.tsx:
   - React Class Component 기반 ErrorBoundary
   - Props: children, fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
   - componentDidCatch에서 에러 로깅
   - 기본 fallback: ErrorState 컴포넌트 사용
   - reset 기능 (this.setState로 hasError false 설정)

2. src/components/feedback/empty-state.tsx:
   - Props: icon?: LucideIcon, title: string, description?: string, action?: { label: string, onClick: () => void }
   - 중앙 정렬 레이아웃
   - icon: text-foreground-muted, 48px
   - title: text-lg font-medium
   - description: text-foreground-sub text-sm
   - action: Button variant='secondary'

3. src/components/feedback/error-state.tsx:
   - Props: title?, description?, onRetry?: () => void
   - 기본 title: '오류가 발생했습니다'
   - 기본 description: '잠시 후 다시 시도해주세요'
   - onRetry 있을 경우 '다시 시도' 버튼 표시
   - AlertTriangle 아이콘 사용, text-danger

4. src/components/feedback/index.ts - 배럴 export 파일

### 5.4. 커스텀 훅 구현 (useInfiniteCursor, useDebounce, useConfirmDialog)

**Status:** pending  
**Dependencies:** None  

공통으로 사용할 커스텀 훅들을 구현합니다. 커서 기반 무한 스크롤 훅, 디바운스 훅, 확인 다이얼로그 상태 관리 훅을 포함합니다.

**Details:**

1. src/hooks/useInfiniteCursor.ts:
   - TanStack Query useInfiniteQuery 래퍼
   - 제네릭: <T, C> (T: 아이템 타입, C: 커서 타입)
   - Parameters: queryKey, fetcher, pageSize(기본 10), options
   - fetcher 시그니처: (params: { lastId?: C; pageSize: number }) => Promise<CursorResponse<T, C>>
   - getNextPageParam: lastPage.hasNext ? lastPage.nextCursor : undefined
   - initialPageParam: undefined

2. src/hooks/useDebounce.ts:
   - 제네릭: <T>(value: T, delay?: number) => T
   - 기본 delay: 300ms
   - useEffect + setTimeout으로 구현
   - cleanup에서 clearTimeout

3. src/hooks/useConfirmDialog.ts:
   - Zustand 미사용, useState 기반 훅
   - 상태: isOpen, title?, description?, onConfirm?, isLoading
   - 메서드: open({ title, description, onConfirm }), close()
   - Dialog 컴포넌트와 함께 사용하도록 설계
   - 비동기 onConfirm 지원 (isLoading 상태)

4. src/hooks/index.ts - 배럴 export 파일

### 5.5. 날짜 유틸 및 (main) 레이아웃 통합

**Status:** pending  
**Dependencies:** 5.1, 5.2  

KST 기반 날짜 포맷 유틸리티를 구현하고, (main) route group에 BottomNav와 Header를 적용한 레이아웃을 구성합니다. root layout에 QueryClientProvider와 Toaster를 설정합니다.

**Details:**

1. src/lib/date.ts:
   - date-fns + date-fns-tz 사용
   - KST = 'Asia/Seoul' 상수
   - FORMAT = 'yyyy-MM-dd HH:mm' 상수
   - formatKst(date: Date): string - toZonedTime으로 KST 변환 후 format
   - parseKst(dateString: string): Date - parse 후 fromZonedTime으로 UTC 변환
   - formatRelative(date: Date): string - '방금 전', '5분 전', '어제' 등 상대 시간

2. src/global/providers/query-provider.tsx:
   - 'use client' 컴포넌트
   - QueryClient 인스턴스 생성 (useState로 한 번만)
   - 기본 옵션: staleTime 60초, retry 1회, refetchOnWindowFocus false
   - QueryClientProvider로 children 래핑

3. src/app/layout.tsx 수정:
   - QueryProvider로 body 래핑
   - Toaster 컴포넌트 추가

4. src/app/(main)/layout.tsx 생성:
   - Props: children
   - BottomNav 하단 고정
   - main 영역에 pb-16 (BottomNav 높이만큼 패딩)
   - Container로 children 래핑

5. src/app/(main)/home/page.tsx, bands/page.tsx 등 플레이스홀더 페이지 생성
