# Task ID: 2

**Title:** Phase B: 카드/리스트 우측 도메인 IconTile 적용 및 hover/selected 스타일

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** ListPane, HomeItem, BandCard, PracticeCard, PerformanceCard 등 모든 카드형 행에 도메인 IconTile을 좌측에 배치하고, design/dist/css/screens.css의 .list-item hover/selected 스타일 재현

**Details:**

1. 변경 대상 컴포넌트:
   - src/domain/band/components/BandCard.tsx
   - src/domain/band/components/MyBands.tsx
   - src/domain/practice/components/PracticeCard.tsx
   - src/domain/practice/components/UpcomingPractices.tsx
   - src/domain/performance/components/PerformanceCard.tsx
   - src/domain/performance/components/UpcomingPerformances.tsx
   - src/app/(main)/bands/BandsListPane.client.tsx

2. 스타일 적용 (screens.css .list-item 기준):
   ```css
   .list-item:hover { background: var(--card); }
   .list-item.is-selected {
     background: var(--accent-dim);
     border-color: oklch(0.62 0.22 250 / 0.26);
   }
   .list-item.is-selected--amber {
     background: var(--amber-dim);
     border-color: oklch(0.72 0.18 48 / 0.26);
   }
   ```

3. Tailwind 클래스 매핑:
   - hover:bg-card
   - selected: bg-accent-dim border border-accent/25
   - transition: transition-all duration-fast

4. IconTile 배치:
   - 밴드: tone='accent', icon=Guitar
   - 합주: tone='success', icon=Clock3
   - 공연: tone='amber', icon=Music

**Test Strategy:**

1. 각 컴포넌트 별 시각 확인 (hover/selected 상태 전환)
2. lg breakpoint에서 마스터-디테일 레이아웃 확인
3. 모바일에서 카드 렌더링 확인
4. pnpm lint && pnpm typecheck 통과

## Subtasks

### 2.1. IconTile 컴포넌트 존재 여부 확인 및 Task 1 완료 검증

**Status:** pending  
**Dependencies:** None  

Phase A(Task 1)에서 생성된 IconTile 컴포넌트와 domain-icons.tsx 파일이 존재하는지 확인하고, 누락 시 기본 구현을 생성하여 Phase B 작업의 전제 조건 충족

**Details:**

1. src/components/ui/icon-tile.tsx 파일 존재 확인
2. src/lib/domain-icons.tsx 파일 존재 확인
3. IconTile 컴포넌트가 size(sm/md/lg)와 tone(accent/success/amber/warn/card) props를 지원하는지 검증
4. 누락된 경우 Task 1 details 기반으로 기본 구현 생성:
   - IconTile: tone별 배경색/아이콘색 조합, 반경 rounded-lg
   - DOMAIN_ICONS: band=Guitar, practice=Clock3, performance=Music
5. globals.css에 transition-all duration-fast 유틸리티 클래스 사용 가능 여부 확인

### 2.2. list-item 스타일 기반 공용 ListItem 래퍼 또는 스타일 유틸리티 정의

**Status:** pending  
**Dependencies:** 2.1  

design/dist/css/screens.css의 .list-item hover/selected 스타일을 Tailwind 클래스로 매핑한 공용 유틸리티 또는 래퍼 컴포넌트 생성

**Details:**

1. screens.css .list-item 스타일 분석:
   - 기본: gap-12px, padding-12px, rounded-12px, transparent bg, transparent border
   - hover: bg-card
   - selected(accent): bg-accent-dim, border-color oklch(0.62 0.22 250 / 0.26)
   - selected(amber): bg-amber-dim, border-color oklch(0.72 0.18 48 / 0.26)

2. Tailwind 클래스 매핑 정의 (src/lib/list-item-styles.ts 또는 inline):
   - base: 'flex gap-3 p-3 rounded-lg bg-transparent border border-transparent transition-all duration-fast cursor-pointer'
   - hover: 'hover:bg-card'
   - selectedAccent: 'bg-accent-dim border-accent/25'
   - selectedAmber: 'bg-amber-dim border-amber/25'

3. cn() 유틸리티와 조합하여 isSelected prop에 따른 동적 스타일 적용 패턴 문서화

### 2.3. BandCard, PracticeCard, PerformanceCard에 IconTile 및 list-item 스타일 적용

**Status:** pending  
**Dependencies:** 2.1, 2.2  

세 도메인 카드 컴포넌트에 좌측 IconTile 배치, Card 컴포넌트 대신 list-item 스타일 직접 적용, hover 상태 구현

**Details:**

1. BandCard.tsx 수정:
   - Card 컴포넌트 제거, flex 레이아웃 + list-item 스타일 직접 적용
   - Avatar 앞에 <IconTile icon={Guitar} tone='accent' size='md' /> 추가
   - hover:bg-card transition-all duration-fast 적용

2. PracticeCard.tsx 수정:
   - Card 제거, list-item 스타일 적용
   - 좌측에 <IconTile icon={Clock3} tone='success' size='md' /> 추가
   - 기존 메타 정보(일정/장소/곡) 유지

3. PerformanceCard.tsx 수정:
   - Card 제거, list-item 스타일 적용
   - 좌측에 <IconTile icon={Music} tone='amber' size='md' /> 추가
   - PerformanceDday 우측 배치 유지

4. 각 카드 공통:
   - Link wrapper 유지 (focus-visible 스타일 유지)
   - isSelected prop 추가 (선택적, 마스터-디테일 레이아웃용)

### 2.4. ListPane 및 홈 화면 카드 행에 IconTile/selected 스타일 적용 및 최종 검증

**Status:** pending  
**Dependencies:** 2.1, 2.2, 2.3  

BandsListPane의 BandRow, MyBands, UpcomingPractices, UpcomingPerformances 컴포넌트에 IconTile 및 selected 상태 스타일 적용 후 전체 통합 테스트

**Details:**

1. BandsListPane.client.tsx의 BandRow 수정:
   - 기존 Link 내부에 IconTile(Guitar, accent, sm) 추가
   - active 상태: bg-accent-dim border-accent/25 스타일 적용
   - hover: hover:bg-card 적용

2. MyBands.tsx:
   - BandCard 호출 시 IconTile 포함 여부 확인 (BandCard 자체에 적용됨)

3. UpcomingPractices.tsx / UpcomingPerformances.tsx:
   - PracticeCard/PerformanceCard 호출 시 IconTile 포함 여부 확인

4. PracticesListPane.client.tsx, PerformancesListPane.client.tsx 존재 시 동일 패턴 적용

5. 최종 검증:
   - lg breakpoint에서 마스터-디테일 레이아웃 확인
   - 모바일(< lg)에서 카드 렌더링 확인
   - pnpm lint && pnpm typecheck 통과
