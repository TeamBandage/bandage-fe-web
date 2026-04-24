# Task ID: 5

**Title:** 공용 컴포넌트 신규 구현 및 기존 컴포넌트 variant 보정

**Status:** pending

**Dependencies:** 1 ✓

**Priority:** high

**Description:** RoleBadge, SectionTitle, Divider, StatCard, EmptyPane, ResponsiveSheet 등 신규 컴포넌트를 구현하고, Button/Badge/Card/Chip/Dialog 등 기존 컴포넌트의 variant를 디자인 원본과 일치시킨다.

**Details:**

1. 신규 컴포넌트 구현 (src/components/ui/):
   - role-badge.tsx: role('LEADER'|'ADMIN'|'MEMBER') → 역할별 색상(--color-role-*) 적용
   - section-title.tsx: title + optional action 슬롯, uppercase, 12px, letterSpacing
   - divider.tsx: h-px bg-border, optional inset prop
   - stat-card.tsx: icon + label + value, Home 통계 그리드용

2. src/components/feedback/empty-pane.tsx 구현:
   - 아이콘 + 타이틀 + 설명, PaneDetail 플레이스홀더용

3. src/components/ui/responsive-sheet.tsx 구현:
   - 데스크톱(lg:)에서는 Dialog, 모바일에서는 BottomSheet로 자동 전환

4. Button variant 보정:
   - accent-outline variant 추가
   - padding/font를 토큰화

5. Badge variant 보정:
   - amber, muted variant 추가
   - 기존 코드베이스에서 사용 중인 variant 마이그레이션

6. Card 보정:
   - interactive prop이 --color-card-hover 토큰 사용하도록 확인

7. Chip 보정:
   - sessionTypeToken 유틸 추출 (src/lib/session-type.ts)
   - 하드코딩된 oklch 값을 유틸 함수로 대체

8. Dialog 보정:
   - sheetOnMobile prop 추가 옵션

**Test Strategy:**

1. 모든 신규 컴포넌트에 Vitest 스냅샷 테스트 작성
2. 기존 컴포넌트 variant 변경 시 기존 테스트 갱신(pnpm test -u)
3. /playground 페이지에 컴포넌트 매트릭스 섹션 업데이트
4. 사용처에서 스타일 깨짐 없는지 수동 회귀 확인

## Subtasks

### 5.1. 신규 기본 UI 컴포넌트 구현 (RoleBadge, SectionTitle, Divider)

**Status:** pending  
**Dependencies:** None  

RoleBadge, SectionTitle, Divider 3개의 기본 UI 컴포넌트를 src/components/ui/에 신규 구현한다.

**Details:**

1. **role-badge.tsx** 구현:
   - Props: `role: 'LEADER' | 'ADMIN' | 'MEMBER'`, `className?`
   - 기존 `--color-role-leader`, `--color-role-admin`, `--color-role-member` 토큰 활용
   - 역할별 배경색(dim)/텍스트색 조합: LEADER(orange), ADMIN(blue), MEMBER(gray)
   - 라벨: 리더/관리자/멤버
   - 기존 BandRoleBadge(도메인 컴포넌트)는 이 공용 RoleBadge를 래핑하도록 리팩토링

2. **section-title.tsx** 구현:
   - Props: `title: string`, `action?: ReactNode`, `className?`
   - 스타일: uppercase, text-xs(12px), tracking-wider, text-foreground-muted
   - action 슬롯: 우측 정렬, 주로 '전체 보기 →' 링크용
   - flex justify-between items-center 레이아웃

3. **divider.tsx** 구현:
   - Props: `inset?: boolean`, `className?`
   - 기본: h-px bg-border w-full
   - inset=true: mx-4 (양쪽 여백)
   - 시맨틱: role='separator', aria-orientation='horizontal'

### 5.2. StatCard, EmptyPane 컴포넌트 구현

**Status:** pending  
**Dependencies:** 5.1  

Home 통계 그리드용 StatCard와 PaneDetail 플레이스홀더용 EmptyPane 컴포넌트를 구현한다.

**Details:**

1. **stat-card.tsx** (src/components/ui/) 구현:
   - Props: `icon: LucideIcon`, `label: string`, `value: string | number`, `className?`
   - 레이아웃: Card 기반, flex items-center gap-3
   - 아이콘: 40x40 bg-accent-dim rounded-md 컨테이너 내 24x24 text-accent
   - label: text-foreground-sub text-xs
   - value: text-foreground text-xl font-semibold
   - padding='md' 기본값

2. **empty-pane.tsx** (src/components/feedback/) 구현:
   - Props: `icon?: LucideIcon`, `title: string`, `description?: string`, `className?`
   - 기존 EmptyState와 유사하나 PaneDetail(마스터-디테일 우측 패널) 플레이스홀더 전용
   - 레이아웃: flex flex-col items-center justify-center h-full
   - 아이콘: h-16 w-16 text-foreground-muted
   - title: text-foreground-sub text-lg
   - description: text-foreground-muted text-sm
   - 액션 버튼 슬롯 없음 (EmptyState와의 차이점)

### 5.3. ResponsiveSheet 컴포넌트 구현

**Status:** pending  
**Dependencies:** 5.1  

데스크톱(lg: 이상)에서는 Dialog, 모바일에서는 BottomSheet로 자동 전환되는 ResponsiveSheet 컴포넌트를 구현한다.

**Details:**

1. **responsive-sheet.tsx** (src/components/ui/) 구현:
   - 기존 Dialog, BottomSheet 컴포넌트를 조합
   - useMediaQuery 또는 Tailwind lg: breakpoint(960px) 기준 분기
   - Props: Dialog/BottomSheet 공통 props 통합 (open, onOpenChange, children)
   - 내보내기: ResponsiveSheet, ResponsiveSheetTrigger, ResponsiveSheetContent, ResponsiveSheetHeader, ResponsiveSheetBody, ResponsiveSheetFooter, ResponsiveSheetTitle, ResponsiveSheetDescription, ResponsiveSheetClose

2. **useMediaQuery 훅** (src/hooks/use-media-query.ts) 구현 (없을 경우):
   - matchMedia API 활용
   - SSR 안전 처리 (초기값 false)
   - resize 이벤트 리스너 등록/해제

3. ResponsiveSheetContent 구현 로직:
   - const isDesktop = useMediaQuery('(min-width: 960px)')
   - isDesktop ? DialogContent : BottomSheetContent 렌더링
   - Header/Body/Footer도 동일하게 조건부 렌더링

### 5.4. Button, Badge 컴포넌트 variant 보정

**Status:** pending  
**Dependencies:** None  

Button에 accent-outline variant 추가, Badge에 amber/muted variant 추가하고 padding/font를 디자인 토큰화한다.

**Details:**

1. **Button variant 보정** (src/components/ui/button.tsx):
   - 새 variant 추가: `accent-outline` (border-accent text-accent bg-transparent hover:bg-accent-dim)
   - ButtonVariant 타입에 'accent-outline' 추가
   - variantClasses Record에 accent-outline 스타일 추가
   - sizeClasses의 px/text 값을 토큰 기반으로 정리 (현재 하드코딩된 값 유지 가능, 일관성 확인)

2. **Badge variant 보정** (src/components/ui/badge.tsx):
   - 새 variant 추가: `amber` (bg-[oklch(0.76_0.17_85_/_0.15)] text-[oklch(0.76_0.17_85)] - warn 색상 계열)
   - 새 variant 추가: `muted` (bg-surface text-foreground-muted border-transparent)
   - BadgeVariant 타입 확장: 'default' | 'accent' | 'success' | 'warn' | 'danger' | 'amber' | 'muted'
   - 기존 사용처 확인 후 호환성 유지

3. 기존 코드베이스에서 Badge 사용처 검색하여 마이그레이션 필요 여부 확인

### 5.5. Chip sessionTypeToken 유틸 추출 및 Dialog sheetOnMobile 옵션 검토

**Status:** pending  
**Dependencies:** 5.3  

Chip 컴포넌트의 하드코딩된 OKLCH 세션 색상을 유틸 함수로 추출하고, Dialog에 sheetOnMobile 옵션 추가 가능성을 검토한다.

**Details:**

1. **sessionTypeToken 유틸 추출** (src/lib/session-type.ts):
   - Chip의 sessionClasses Record를 별도 유틸로 분리
   - 함수: `getSessionTypeClasses(session: SessionType): { bg: string; text: string }`
   - 또는 Record export: `SESSION_TYPE_CLASSES: Record<SessionType, string>`
   - Chip 컴포넌트에서 이 유틸 import하여 사용하도록 리팩토링
   - 다른 컴포넌트(예: 세션 관련 Badge, 리스트 아이템)에서 재사용 가능

2. **Chip 리팩토링** (src/components/ui/chip.tsx):
   - 하드코딩된 sessionClasses를 session-type.ts 유틸로 대체
   - 기존 동작 유지 확인

3. **Dialog sheetOnMobile 옵션 검토**:
   - ResponsiveSheet가 이미 이 역할을 수행하므로 Dialog 자체에 옵션 추가는 불필요할 수 있음
   - 대안: Dialog 사용처에서 ResponsiveSheet로 대체하도록 가이드 문서화
   - 또는 DialogContent에 `asSheet?: boolean` prop 추가하여 모바일에서 BottomSheet 스타일 적용 (optional)
