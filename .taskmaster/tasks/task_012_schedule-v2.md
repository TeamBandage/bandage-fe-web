# Task ID: 12

**Title:** mock 데이터 및 자동 추천 알고리즘

**Status:** pending

**Dependencies:** 4

**Priority:** medium

**Description:** 시간표 카드 mock 데이터 + 자동 추천 알고리즘 구현. 멤버 가용 종합에서 동시 가능 인원 최대 슬롯 N개 선택 후 곡 배치.

**Details:**

1. domain/schedule-coordination/mock/boardSeed.ts 생성
   - mt1 회의에 대해 1-3개 시간표 카드 + 블록 배치
   - 색상 팔레트 시드 고정
2. domain/schedule-coordination/utils/autoSuggest.ts
```ts
export function suggestScheduleBoards(
  schedules: MemberSchedule[],
  songs: Song[],
  dates: string[],
  count: number = 3
): ScheduleBoard[] {
  // 1. aggregateAvailability로 날짜/슬롯별 가능 인원 수 계산
  const aggregate = aggregateAvailability(schedules, dates);
  
  // 2. 가능 인원 많은 슬롯 정렬
  const ranked = rankSlots(aggregate);
  
  // 3. 상위 슬롯에 곡 순차 배치
  // 4. count개 변형 생성 (다른 시작점 또는 우선순위)
  return boards;
}
```
3. 자동 추천 시 고려사항:
   - 곡 duration 기반 슬롯 수 계산 (기본 4슬롯=2시간)
   - 곡 간 겹침 방지
   - 같은 날 연속 배치 우선
4. boardStore 초기 상태에 SEEDED_BOARDS 적용

**Test Strategy:**

1. mock 데이터 정상 로드
2. 자동 추천 결과 3개 보드 생성
3. 추천 슬롯이 실제 가용 인원 많은 시간대
4. 곡 간 겹침 없음
5. 빈 카드 2개 추가 생성

## Subtasks

### 12.1. ScheduleBoard 타입 및 관련 인터페이스 정의

**Status:** pending  
**Dependencies:** None  

시간표 카드(ScheduleBoard)와 곡 블록(SongBlock) 타입을 types.ts에 추가하고, 색상 팔레트 상수를 정의합니다.

**Details:**

domain/schedule-coordination/types.ts 파일에 다음 타입을 추가합니다:

1. SongBlock 인터페이스 정의:
   - songId: string (setlist-meeting Song.id 참조)
   - date: string (YYYY-MM-DD)
   - startSlot: number (0-47)
   - endSlot: number (0-47, exclusive)
   - color: string (hex 색상)

2. ScheduleBoard 인터페이스 정의:
   - id: string
   - meetingId: string
   - name: string (시간표 카드 이름)
   - blocks: SongBlock[]
   - createdAt: string (ISO)
   - isAutoSuggested: boolean (자동 추천 여부)

3. COLOR_PALETTE 상수 배열 정의 (10개 정도의 구분 가능한 hex 색상)

기존 AggregateSlot, MemberSchedule 타입과 일관성 유지. Song 타입은 setlist-meeting 도메인에서 import하여 사용.

### 12.2. boardStore Zustand store 생성

**Status:** pending  
**Dependencies:** 12.1  

시간표 카드(ScheduleBoard) 상태를 관리하는 Zustand store를 생성하고, SEEDED_BOARDS 초기 상태를 적용합니다.

**Details:**

domain/schedule-coordination/store/boardStore.ts 파일을 새로 생성합니다:

1. State 인터페이스:
   - boards: Record<string, ScheduleBoard[]> (meetingId → 보드 목록)
   - confirmedBoardId: Record<string, string | null> (meetingId → 확정된 보드 id)

2. Actions 인터페이스:
   - getBoards(meetingId: string): ScheduleBoard[]
   - addBoard(board: ScheduleBoard): void
   - updateBoard(boardId: string, patch: Partial<ScheduleBoard>): void
   - deleteBoard(boardId: string): void
   - setConfirmedBoard(meetingId: string, boardId: string | null): void
   - isConfirmed(meetingId: string): boolean
   - reset(): void

3. persist 미들웨어 적용 (localStorage, key: 'bandage-board-v1')
4. scheduleStore.ts 패턴 참조하여 noopStorage 적용 (SSR 대응)
5. SEEDED_BOARDS 초기 상태 적용 (서브태스크 3에서 import)

### 12.3. boardSeed.ts mock 시간표 카드 데이터 생성

**Status:** pending  
**Dependencies:** 12.1  

mt1 회의에 대한 1-3개의 시간표 카드 mock 데이터를 생성하고, 색상 팔레트를 적용한 블록 배치를 구현합니다.

**Details:**

domain/schedule-coordination/mock/boardSeed.ts 파일을 새로 생성합니다:

1. scheduleSeed.ts의 MEETING_ID, PRACTICE_FROM, PRACTICE_TO 상수 재사용
2. seed.ts의 mt1 회의 곡 목록(sg1~sg7) 참조하여 3개 시간표 카드 생성

예시 구조:
- Board 1 '주말 오후 집중형': 주말(토/일) 13:00-17:00에 곡 3개 배치
- Board 2 '평일 저녁 분산형': 평일 저녁 19:00-22:00에 곡 2개씩 배치
- Board 3 '혼합형': 주말 오후 + 평일 저녁 조합

3. COLOR_PALETTE에서 곡 순서대로 색상 할당 (index % palette.length)
4. 곡 duration 파싱하여 슬롯 수 계산 (30분 = 1슬롯, 기본 4슬롯 = 2시간)
5. export const SEED_BOARDS: ScheduleBoard[] 형태로 내보내기
6. boardStore 초기 상태에서 import하여 SEEDED_BOARDS로 사용

### 12.4. autoSuggest.ts 자동 추천 알고리즘 구현

**Status:** pending  
**Dependencies:** 12.1, 12.2  

멤버 가용 시간을 종합하여 동시 가능 인원이 최대인 슬롯에 곡을 배치하는 자동 추천 알고리즘을 구현합니다.

**Details:**

domain/schedule-coordination/utils/autoSuggest.ts 파일을 새로 생성합니다:

1. parseDurationToSlots(duration: string | undefined): number 함수
   - 'mm:ss' 포맷을 30분 슬롯 수로 변환 (올림 처리, 기본 4슬롯)

2. rankSlots(aggregate: Record<string, number[]>): RankedSlot[] 함수
   - date, startSlot, availableCount 객체 배열 반환
   - availableCount 내림차순 정렬

3. suggestScheduleBoards 메인 함수:
```ts
export function suggestScheduleBoards(
  schedules: MemberSchedule[],
  songs: Song[],
  dates: string[],
  count: number = 3
): ScheduleBoard[]
```

알고리즘:
1. aggregateAvailability(schedules, dates)로 날짜/슬롯별 가능 인원 수 계산
2. rankSlots로 가능 인원 많은 슬롯 정렬
3. 곡 순차 배치 시 고려사항:
   - 곡 duration 기반 슬롯 수 계산
   - 이미 배치된 블록과 겹침 방지 (hasOverlap 체크)
   - 같은 날 연속 배치 우선 (날짜 그룹핑)
4. count개 변형 생성 (다른 시작점, 우선순위 변형)
5. COLOR_PALETTE 적용하여 ScheduleBoard[] 반환
