# Task ID: 1

**Title:** Phase A: 디자인 토큰 보강 및 IconTile 컴포넌트 생성

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** design/dist/css/tokens.css 기반으로 globals.css 누락 토큰 보강, 도메인별 아이콘 매핑(lib/domain-icons.tsx), 재사용 가능한 IconTile 컴포넌트(components/ui/icon-tile.tsx) 구현

**Details:**

1. globals.css 토큰 비교 및 보강:
   - design/dist/css/tokens.css의 --t-fast(120ms), --t-med(200ms) 확인 → 기존 --duration-fast, --duration-normal과 매핑
   - --ease: cubic-bezier(0.2, 0.8, 0.2, 1) → --ease-default와 일치 확인

2. src/lib/domain-icons.tsx 신규 생성:
   ```tsx
   import { Music2, Guitar, Clock3, Rewind, Music } from 'lucide-react';
   export const DOMAIN_ICONS = {
     band: Guitar,
     practice: Clock3,
     performance: Music,
   } as const;
   export type DomainType = keyof typeof DOMAIN_ICONS;
   ```

3. src/components/ui/icon-tile.tsx 신규 생성:
   ```tsx
   type IconTileProps = {
     icon: React.ReactNode;
     size?: 'sm' | 'md' | 'lg';
     tone?: 'accent' | 'success' | 'amber' | 'warn' | 'card';
   };
   // size별 px: sm=32, md=40, lg=48
   // tone별 bg: accent → bg-accent-dim, success → bg-success-dim, amber → bg-amber-dim
   ```

4. 스타일 토큰:
   - size: sm(32px, icon 14px), md(40px, icon 18px), lg(48px, icon 22px)
   - border-radius: rounded-md
   - transition: var(--duration-fast) var(--ease-default)

**Test Strategy:**

1. icon-tile.tsx Vitest 스냅샷 테스트 (size/tone 조합별)
2. Storybook 또는 수동 확인: sm/md/lg × accent/success/amber/warn/card 매트릭스
3. pnpm typecheck 통과 확인

## Subtasks

### 1.1. globals.css 디자인 토큰 비교 및 보강

**Status:** pending  
**Dependencies:** None  

design/dist/css/tokens.css와 src/app/globals.css를 비교하여 누락된 토큰을 추가하고, 기존 토큰 매핑을 검증합니다.

**Details:**

1. tokens.css의 --t-fast(120ms), --t-med(200ms)가 globals.css의 --duration-fast(120ms), --duration-normal(200ms)과 이미 매핑되어 있음을 확인
2. tokens.css의 --ease: cubic-bezier(0.2, 0.8, 0.2, 1)가 globals.css의 --ease-default와 일치함을 확인
3. icon-tile 컴포넌트에서 사용할 size별 dimension 토큰이 없다면 추가 검토 (현재 --spacing-s-* 시리즈로 커버 가능: s-8=32px, s-10=40px, s-12=48px)
4. 현재 globals.css에 이미 필요한 색상 토큰(accent-dim, success-dim, amber-dim, warn-dim, card)과 radius 토큰(radius-sm, radius-md)이 모두 존재하므로 추가 보강 불필요
5. components.css의 .icon-tile 스타일 참조: sm=32px, md=40px, lg=56px 및 radius 변형 확인

### 1.2. src/lib/domain-icons.tsx 파일 생성

**Status:** pending  
**Dependencies:** 1.1  

도메인별 아이콘 매핑을 관리하는 domain-icons.tsx 파일을 src/lib 폴더에 신규 생성합니다.

**Details:**

1. lucide-react에서 도메인별 아이콘 import: Guitar(band), Music(practice), CalendarDays(performance)
2. DOMAIN_ICONS 상수 객체 정의: { band: Guitar, practice: Music, performance: CalendarDays } as const
3. DomainType 타입 export: keyof typeof DOMAIN_ICONS
4. 기존 코드에서 사용 중인 아이콘 패턴 참조 (HomeStatCards.client.tsx의 Users, Music, CalendarDays 사용 예시)
5. design/dist/js/icons.js의 band, practice, performance 아이콘 정의 참조하여 lucide-react 아이콘과 매핑
6. 향후 확장 가능하도록 DOMAIN_ICON_COLORS 매핑 (accent, success, amber) 추가 고려

### 1.3. src/components/ui/icon-tile.tsx 컴포넌트 생성

**Status:** pending  
**Dependencies:** 1.1, 1.2  

design/dist/css/components.css의 .icon-tile 스타일을 Tailwind CSS로 구현한 재사용 가능한 IconTile 컴포넌트를 생성합니다.

**Details:**

1. IconTileProps 인터페이스 정의: { icon: React.ReactNode, size?: 'sm' | 'md' | 'lg', tone?: IconTileTone }
2. IconTileTone 타입: 'accent' | 'success' | 'amber' | 'warn' | 'card' (components.css .icon-tile--* 변형 기준)
3. SIZE_CLASSES 매핑: { sm: 'w-8 h-8 rounded-sm', md: 'w-10 h-10 rounded-md', lg: 'w-14 h-14 rounded-[14px]' } (design 기준 sm=32px, md=40px, lg=56px)
4. TONE_CLASSES 매핑: { accent: 'bg-accent-dim text-accent', success: 'bg-success-dim text-success', amber: 'bg-amber-dim text-amber', warn: 'bg-warn-dim text-warn', card: 'bg-card text-foreground-sub' }
5. aria-hidden='true' 속성 추가 (장식용 아이콘)
6. transition 클래스 추가: transition-colors duration-fast
7. Badge 컴포넌트 패턴 참조하여 일관된 코드 스타일 유지
8. cn 유틸 사용하여 className 병합 지원

### 1.4. icon-tile.test.tsx 테스트 파일 작성

**Status:** pending  
**Dependencies:** 1.3  

IconTile 컴포넌트의 Vitest 스냅샷 테스트와 기능 테스트를 작성합니다.

**Details:**

1. 테스트 파일 위치: src/components/ui/icon-tile.test.tsx
2. 기존 테스트 패턴 참조 (button.test.tsx, common-components.test.tsx)
3. 테스트 케이스:
   - 기본 렌더링 (md/accent 기본값) 스냅샷
   - size prop 변경에 따른 클래스 변경 확인 (sm, md, lg)
   - tone prop 변경에 따른 클래스 변경 확인 (accent, success, amber, warn, card)
   - aria-hidden='true' 속성 존재 확인
   - className prop 병합 동작 확인
4. lucide-react 아이콘을 children으로 전달하는 테스트 포함
5. @testing-library/react의 render, screen 사용
6. describe/it 블록 구조로 한글 테스트 설명 작성
