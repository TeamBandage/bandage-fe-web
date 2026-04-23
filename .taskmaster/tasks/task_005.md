# Task ID: 5

**Title:** 레이아웃 컴포넌트 및 피드백 시스템 구축

**Status:** pending

**Dependencies:** 3, 4

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
