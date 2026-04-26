# Task ID: 4

**Title:** 회의 목록 마스터 패널 — 라우트 + ListPane 구현

**Status:** pending

**Dependencies:** 2, 3

**Priority:** high

**Description:** /setlist-meetings 라우트와 layout, SetlistMeetingsListPane 마스터 패널을 구현한다.

**Details:**

## 파일 구조
```
src/app/(main)/setlist-meetings/
├── page.tsx                        # 첫 회의 자동 선택 → redirect
├── layout.tsx                      # 마스터 패널 + children
└── SetlistMeetingsListPane.client.tsx
```

## page.tsx
```tsx
import { redirect } from 'next/navigation';
import { SEED_MEETINGS } from '@/domain/setlist-meeting/mock/seed';
import { ROUTES } from '@/global/config/routes';

export default function SetlistMeetingsPage() {
  const first = SEED_MEETINGS[0];
  if (first) redirect(ROUTES.SETLIST_MEETING_DETAIL(first.id));
  return null; // 빈 상태는 layout에서 처리
}
```

## layout.tsx
```tsx
export default function SetlistMeetingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <SetlistMeetingsListPane />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
```

## SetlistMeetingsListPane.client.tsx
- 헤더: "선곡 회의" 타이틀 + "N건 참여" 부제
- '회의 만들기' 버튼 (BE 미지원 → toast.info 안내)
- 회의 카드 리스트:
  - 밴드명 (accent 색상, text-caption)
  - 회의 제목 (text-body font-bold)
  - 진행 막대 (ready/total) + 비율 텍스트
  - updatedAt
- 선택 시 useRouter().push(ROUTES.SETLIST_MEETING_DETAIL(id))
- EmptyState: "참여 중인 선곡 회의가 없습니다"

## 스타일 (Task 1 축소 적용)
- width: var(--list-pane-w) = 280px
- 카드 padding: p-s-2, 제목 text-caption

**Test Strategy:**

1. /setlist-meetings 접근 시 첫 번째 회의로 자동 redirect
2. 마스터 패널에 mock 회의 2건 표시
3. 회의 카드 클릭 시 /setlist-meetings/{id} 이동
4. '회의 만들기' 버튼 클릭 시 toast 안내 표시

## Subtasks

### 4.1. routes.ts에 SETLIST_MEETINGS 라우트 상수 추가

**Status:** pending  
**Dependencies:** None  

src/global/config/routes.ts에 선곡 회의 관련 라우트 상수(SETLIST_MEETINGS, SETLIST_MEETING_DETAIL)를 추가한다.

**Details:**

## 변경 파일
- `src/global/config/routes.ts`

## 구현 내용
```ts
SETLIST_MEETINGS: '/setlist-meetings',
SETLIST_MEETING_DETAIL: (id: string) => `/setlist-meetings/${id}`,
```

기존 ROUTES 객체에 위 두 개의 라우트 상수를 추가한다. PERFORMANCES 다음, ME 이전에 배치한다.

## 참고
- Task 3(사이드바/BottomNav 탭 추가)에서 이 라우트를 사용할 예정
- Task 2에서 생성될 mock 데이터(SEED_MEETINGS)와 함께 사용

### 4.2. /setlist-meetings 라우트 page.tsx 구현 (첫 회의 자동 redirect)

**Status:** pending  
**Dependencies:** 4.1  

/setlist-meetings 접근 시 첫 번째 회의로 자동 redirect하는 page.tsx를 구현한다.

**Details:**

## 파일 생성
- `src/app/(main)/setlist-meetings/page.tsx`

## 구현 내용
```tsx
import { redirect } from 'next/navigation';
import { SEED_MEETINGS } from '@/domain/setlist-meeting/mock/seed';
import { ROUTES } from '@/global/config/routes';

export const metadata: Metadata = {
  title: '선곡 회의 | Bandage',
};

export default function SetlistMeetingsPage() {
  const first = SEED_MEETINGS[0];
  if (first) redirect(ROUTES.SETLIST_MEETING_DETAIL(first.id));
  return null; // 빈 상태는 layout에서 처리
}
```

## 의존성
- Task 2에서 생성되는 `SEED_MEETINGS` mock 데이터 필요
- Subtask 1에서 추가한 ROUTES.SETLIST_MEETING_DETAIL 라우트 사용

### 4.3. /setlist-meetings layout.tsx 마스터-디테일 레이아웃 구현

**Status:** pending  
**Dependencies:** 4.2  

마스터 패널(SetlistMeetingsListPane)과 children을 나란히 배치하는 layout.tsx를 구현한다.

**Details:**

## 파일 생성
- `src/app/(main)/setlist-meetings/layout.tsx`

## 구현 내용
```tsx
import { Suspense, type ReactNode } from 'react';
import { SetlistMeetingsListPane } from './SetlistMeetingsListPane.client';

export default function SetlistMeetingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Suspense fallback={null}>
        <SetlistMeetingsListPane />
      </Suspense>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
```

## 참고
- 기존 practices/layout.tsx 패턴을 따름
- lg 이상에서 좌우 분할, 모바일에서는 세로 스택
- ListPane은 'use client' 컴포넌트이므로 Suspense로 감싸서 import

### 4.4. SetlistMeetingsListPane.client.tsx 마스터 패널 컴포넌트 구현

**Status:** pending  
**Dependencies:** 4.1, 4.3  

회의 목록을 표시하는 마스터 패널 컴포넌트를 구현한다. 헤더, 회의 카드 리스트, 진행 막대, EmptyState를 포함한다.

**Details:**

## 파일 생성
- `src/app/(main)/setlist-meetings/SetlistMeetingsListPane.client.tsx`

## 구현 내용
1. **헤더 영역**
   - '선곡 회의' 타이틀 (text-subtitle font-bold)
   - 'N건 참여' 부제 (text-caption text-foreground-muted)
   - '회의 만들기' 버튼 (BE 미지원 → `useToastStore.getState().add({ type: 'info', message: '회의 만들기 기능은 준비 중입니다.' })`)

2. **회의 카드 리스트**
   - SEED_MEETINGS에서 목록 로드
   - 각 카드 구성:
     - 밴드명 (text-accent text-caption)
     - 회의 제목 (text-body font-bold)
     - 진행 막대: `(ready/total)` 비율로 width 계산, bg-success rounded-full h-1.5
     - 비율 텍스트: `{ready}/{total}곡 준비 완료`
     - updatedAt (formatInTimeZone으로 Asia/Seoul 포맷)
   - 선택 시 `router.push(ROUTES.SETLIST_MEETING_DETAIL(id))`
   - 선택 상태: pathname과 비교하여 listItemClasses(active, 'accent') 적용

3. **EmptyState**
   - 회의가 없을 때: EmptyState 컴포넌트 사용
   - title: '참여 중인 선곡 회의가 없습니다'

## 스타일
- width: `var(--list-pane-w)` (280px, Task 1에서 정의)
- 카드 padding: `p-s-2`
- 제목: `text-caption`
- 기존 PracticesListPane.client.tsx 패턴 참고

## Import
- `useRouter`, `usePathname` from 'next/navigation'
- `SEED_MEETINGS` from '@/domain/setlist-meeting/mock/seed'
- `useToastStore` from '@/global/store/toastStore'
- `listItemClasses` from '@/lib/list-item-styles'
- `formatInTimeZone` from 'date-fns-tz'
- `Button` from '@/components/ui/button'
- `EmptyState` from '@/components/feedback/empty-state'
