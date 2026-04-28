# Task ID: 2

**Title:** 메인 절반 분할 + 언더라인 탭 UI

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** SchedulingMain 컴포넌트를 좌우 40/60 분할 구조로 재설계. 좌측에 언더라인 탭(멤버 시간표/합주곡 시간표/합주 시간표 생성), 우측에 큰 시각화 영역 배치.

**Details:**

1. SchedulingMain.client.tsx 리팩토링
   - 기존 좌우 절반 멤버/곡 리스트 구조 제거
   - 새 구조: 좌측(40%) 언더라인 탭 + 우측(60%) 시각화 영역
2. UnderlineTabs 컴포넌트 분리 - components/ui/underline-tabs.tsx
3. 좌측 탭 구성:
   - '멤버 시간표' - 멤버 리스트(아바타/이름/입력 상태). 클릭 시 우측에 가용 캘린더
   - '합주곡 시간표' - 곡 리스트(필터). 클릭 시 우측에 동시 가능 매트릭스
   - '합주 시간표 생성' (매니저 전용) - 시간표 카드 목록
4. 우측 시각화 영역 슬롯:
   - MemberAvailabilityViewer.client.tsx - 멤버 가용 캘린더 + 히트맵
   - SongAvailabilityMatrix.client.tsx - 곡 동시 가능 매트릭스
   - ScheduleBoardEditor.client.tsx - 시간표 에디터

```tsx
type LeftTab = 'member' | 'song' | 'schedule';
type RightPanel = 
  | { kind: 'member'; member: Member }
  | { kind: 'song'; song: Song }
  | { kind: 'board'; boardId: string }
  | null;
```

**Test Strategy:**

1. 탭 전환 동작 - 각 탭 클릭 시 좌측 리스트 변경
2. 매니저가 아닌 경우 '합주 시간표 생성' 탭 비표시
3. 멤버/곡 클릭 시 우측 패널 교체
4. md breakpoint 이하에서 세로 스택 레이아웃
5. 60/40 비율 유지 확인 (lg 이상)

## Subtasks

### 2.1. UnderlineTabs 공용 컴포넌트 분리 및 타입 정의 확장

**Status:** pending  
**Dependencies:** None  

SchedulingMain.client.tsx에 인라인으로 정의된 UnderlineTabs 컴포넌트를 components/ui/underline-tabs.tsx로 분리하고, 좌측 탭/우측 패널 타입 정의를 domain/schedule-coordination/types.ts에 추가한다.

**Details:**

1. components/ui/underline-tabs.tsx 생성:
   - 기존 SchedulingMain.client.tsx 라인 454-485의 UnderlineTabs 컴포넌트를 독립 파일로 추출
   - 제네릭 타입 지원 유지 (UnderlineTabs<T extends string>)
   - props: value, onChange, items (ReadonlyArray<{ id: T; label: string; disabled?: boolean }>)
   - Tailwind 스타일링: border-b-2, border-accent (active), border-transparent (inactive)
   - 접근성: aria-selected, role='tab' 추가

2. domain/schedule-coordination/types.ts 확장:
   - LeftTab 타입 추가: 'member' | 'song' | 'schedule'
   - RightPanel 유니온 타입 추가: { kind: 'member'; member: Member } | { kind: 'song'; song: Song } | { kind: 'board'; boardId: string } | null
   - 기존 RightPanel 타입(SchedulingMain.client.tsx 라인 25)을 도메인 타입으로 이동

3. 기존 components/ui/tabs.tsx의 variant='underline'과 별개로, 더 간결한 컨트롤드 컴포넌트 방식의 UnderlineTabs 제공 (Radix 의존 없이 순수 버튼 기반)

### 2.2. SchedulingMain 좌우 40/60 분할 레이아웃 재설계

**Status:** pending  
**Dependencies:** 2.1  

기존 SchedulingMain.client.tsx의 좌우 50/50 멤버/곡 리스트 구조를 40/60 비율의 탭 영역 + 시각화 영역으로 재구성한다.

**Details:**

1. SchedulingMain.client.tsx 리팩토링:
   - 기존 Main split 영역(라인 143-239)을 새 구조로 교체
   - 좌측 영역(40%): UnderlineTabs + 탭별 컨텐츠(멤버 리스트, 곡 리스트, 시간표 목록)
   - 우측 영역(60%): 시각화 패널 슬롯
   - Tailwind 클래스: flex flex-col lg:flex-row, 좌측 lg:w-[40%], 우측 lg:w-[60%]
   - 모바일(md 이하)에서는 세로 스택: 탭 영역 상단 고정, 시각화 영역 하단

2. 상태 관리 통합:
   - leftTab: LeftTab 상태 추가 (기본값 'member')
   - rightPanel: RightPanel 상태는 기존 유지, 'board' kind 추가 대응
   - 탭 전환 시 rightPanel 초기화 로직

3. 레이아웃 스타일링:
   - 좌측: border-r border-border, overflow-y-auto
   - 우측: bg-surface-dim 또는 bg-card로 시각적 구분
   - 높이: flex-1로 부모 채우기, 각 영역 내부 스크롤

### 2.3. 좌측 3탭 컨텐츠 영역 구현 (멤버/곡/시간표 리스트)

**Status:** pending  
**Dependencies:** 2.2  

좌측 40% 영역에 표시될 3개 탭의 리스트 컨텐츠를 구현한다. 멤버 시간표 탭, 합주곡 시간표 탭, 합주 시간표 생성 탭(매니저 전용).

**Details:**

1. 멤버 시간표 탭 ('member'):
   - 기존 멤버 리스트 UI 재사용 (라인 145-193)
   - 아바타 + 이름 + 입력 상태 배지(완료/입력 중/미입력)
   - 클릭 시 setRightPanel({ kind: 'member', member })

2. 합주곡 시간표 탭 ('song'):
   - 기존 곡 리스트 UI 재사용 (라인 195-238)
   - 곡 제목 + 아티스트 + '합주 가능' 배지
   - 필터 유지: '내 합주곡' / '전체' (UnderlineTabs 중첩 사용)
   - 클릭 시 setRightPanel({ kind: 'song', song })

3. 합주 시간표 생성 탭 ('schedule'):
   - 매니저(isManager)가 아닌 경우 탭 자체 비표시 또는 disabled
   - 시간표 카드 목록 placeholder (Task 4에서 상세 구현)
   - '+ 시간표 생성' 버튼 placeholder
   - 클릭 시 setRightPanel({ kind: 'board', boardId })

4. 공통 스타일:
   - 각 리스트 아이템: hover:bg-card, border-b border-border
   - 선택된 아이템 하이라이트: bg-accent-dim border-l-2 border-accent

### 2.4. 우측 60% 시각화 영역 슬롯 및 빈 상태 UI 구현

**Status:** pending  
**Dependencies:** 2.2  

우측 시각화 영역에 rightPanel 상태에 따라 적절한 컴포넌트를 렌더링하는 슬롯 구조와 선택 전 빈 상태 UI를 구현한다.

**Details:**

1. 우측 영역 컨테이너:
   - flex-1, bg-card 또는 bg-surface-dim
   - overflow-y-auto, 내부 padding: p-s-4
   - 최소 높이 보장: min-h-[400px] (모바일 세로 스택 시)

2. rightPanel 상태별 렌더링:
   - null: 빈 상태 UI (일러스트 + 안내 문구)
   - { kind: 'member' }: MemberSchedulePanel 렌더링 (기존 라인 316-386 재사용)
   - { kind: 'song' }: SongMatrixPanel 렌더링 (기존 라인 389-451 재사용)
   - { kind: 'board' }: ScheduleBoardEditor placeholder (Task 4에서 상세 구현)

3. 빈 상태 UI:
   - 중앙 정렬 flex flex-col items-center justify-center h-full
   - CalendarDays 또는 적절한 아이콘 (text-foreground-muted, h-12 w-12)
   - 안내 문구: '좌측에서 멤버 또는 곡을 선택하세요'
   - 부가 설명: '선택한 항목의 가용 시간을 확인할 수 있습니다'

4. 헤더 영역 (기존 aside 헤더 패턴 재사용):
   - 패널 제목: '멤버 일정' / '곡 합주 가능 매트릭스' / '시간표 에디터'
   - 닫기 버튼(X): onClick={() => setRightPanel(null)}
