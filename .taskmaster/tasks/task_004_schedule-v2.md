# Task ID: 4

**Title:** 시간표 생성 셸 및 카드 목록 UI

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** 매니저용 '합주 시간표 생성' 탭 구현. 시간표 카드 목록(최대 5개) + '시간표 생성' 버튼 + 자동 추천 mock. 시간표 CRUD store 추가.

**Details:**

1. domain/schedule-coordination/types.ts 확장
```ts
export interface ScheduleBoard {
  boardId: string;
  meetingId: string;
  name: string;       // '안 1', '안 2'
  blocks: ScheduleBlock[];
  pinned: string[];   // pinned blockId
  paletteSeed: number;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBlock {
  blockId: string;
  songId: string;
  date: string;       // 'YYYY-MM-DD'
  startSlot: number;  // 0~47
  durationSlots: number;
  songTitleOverride?: string;
  note?: string;
  pinned: boolean;
  paletteIndex: number;
}
```
2. domain/schedule-coordination/store/boardStore.ts 생성
   - boards: Record<boardId, ScheduleBoard>
   - createBoard, updateBoard, deleteBoard
   - getBoardsByMeeting
3. ScheduleBoardList.client.tsx - 카드 목록 UI
   - 카드당: 이름, 진행도, 옵션 메뉴(수정/삭제)
   - '+ 시간표 생성' 버튼 (5개 제한)
4. '시간표 생성' 버튼 클릭 시:
   - 자동 추천 안 3개 생성 (mock 알고리즘)
   - 빈 카드 2개 추가
   - 기존 수정된 안 있으면 경고 다이얼로그

```tsx
<ScheduleBoardCard
  board={board}
  active={selectedBoardId === board.boardId}
  onClick={() => setSelectedBoardId(board.boardId)}
  onEdit={() => openRenameDialog(board)}
  onDelete={() => openDeleteConfirm(board)}
/>
```

**Test Strategy:**

1. 시간표 카드 최대 5개 제한 확인
2. 시간표 생성 버튼 클릭 시 3+2 카드 생성
3. 카드 이름 수정 동작
4. 카드 삭제 확인 다이얼로그 + 삭제 동작
5. 기존 수정분 있을 때 재생성 경고
6. 비매니저는 탭 비표시

## Subtasks

### 4.1. ScheduleBoard/ScheduleBlock 타입 정의 및 types.ts 확장

**Status:** pending  
**Dependencies:** None  

domain/schedule-coordination/types.ts 파일에 ScheduleBoard와 ScheduleBlock 인터페이스를 추가하여 시간표 카드 데이터 구조를 정의합니다.

**Details:**

types.ts 파일에 다음 타입을 추가합니다:
1. ScheduleBlock 인터페이스 - blockId, songId, date(YYYY-MM-DD), startSlot(0~47), durationSlots, songTitleOverride?, note?, pinned, paletteIndex 필드 포함
2. ScheduleBoard 인터페이스 - boardId, meetingId, name(안 1, 안 2 등), blocks: ScheduleBlock[], pinned: string[], paletteSeed, confirmed, createdAt, updatedAt 필드 포함
3. 기존 MemberSchedule, SlotMask, AggregateSlot 타입과 일관된 네이밍 컨벤션 유지

### 4.2. boardStore.ts Zustand 스토어 생성 및 CRUD 액션 구현

**Status:** pending  
**Dependencies:** 4.1  

domain/schedule-coordination/store/boardStore.ts 파일을 생성하여 시간표 카드(ScheduleBoard) CRUD 관리용 Zustand 스토어를 구현합니다.

**Details:**

scheduleStore.ts 패턴을 참조하여 boardStore.ts 구현:
1. State: boards: Record<boardId, ScheduleBoard> 형태로 저장
2. Actions: createBoard(meetingId, name) - 새 보드 생성 (최대 5개 제한), updateBoard(boardId, partial) - 보드 수정, deleteBoard(boardId) - 보드 삭제, getBoardsByMeeting(meetingId) - 회의별 보드 목록 반환
3. persist 미들웨어로 localStorage 영속화 (키: bandage-board-v1)
4. 개발용 SEEDED_BOARDS 초기 데이터 (mt1 회의용)
5. 보드 최대 5개 제한 로직 포함

### 4.3. ScheduleBoardCard 컴포넌트 및 ScheduleBoardList.client.tsx 구현

**Status:** pending  
**Dependencies:** 4.2  

시간표 카드 목록 UI 컴포넌트를 구현합니다. 개별 카드(이름, 진행도, 옵션 메뉴)와 카드 목록(최대 5개) + '시간표 생성' 버튼을 포함합니다.

**Details:**

domain/schedule-coordination/components/ 폴더에 컴포넌트 생성:
1. ScheduleBoardCard.client.tsx - board 데이터 표시(이름, blocks 기반 진행도 계산), active 상태 스타일, onClick/onEdit/onDelete 콜백, 옵션 메뉴(수정/삭제) 드롭다운
2. ScheduleBoardList.client.tsx - boardStore에서 getBoardsByMeeting으로 카드 목록 조회, 카드 선택 상태(selectedBoardId) 관리, '+ 시간표 생성' 버튼(5개 제한 시 disabled), 이름 수정 다이얼로그, 삭제 확인 다이얼로그(ConfirmDialog 사용)
3. Card, Button, ConfirmDialog 등 기존 UI 컴포넌트 재사용

### 4.4. '시간표 생성' 버튼 자동 추천 로직 및 경고 다이얼로그 구현

**Status:** pending  
**Dependencies:** 4.3  

'시간표 생성' 버튼 클릭 시 자동 추천 안 3개 + 빈 카드 2개 생성 로직과 기존 수정분 경고 다이얼로그를 구현합니다.

**Details:**

ScheduleBoardList.client.tsx에 시간표 생성 기능 추가:
1. 생성 버튼 클릭 핸들러: 기존 수정된 보드가 있는지 확인 후 경고 다이얼로그 표시
2. 경고 다이얼로그: '기존에 수정한 시간표가 있습니다. 새로 생성하면 기존 시간표가 삭제됩니다.' 메시지, 확인/취소 버튼
3. 자동 추천 mock 알고리즘 호출 (Task 12에서 상세 구현 예정, 여기서는 stub): aggregateAvailability 결과 기반 가능 인원 많은 슬롯 N개 선택 후 곡 배치하는 간단한 로직
4. 추천 안 3개(안 1, 안 2, 안 3) + 빈 카드 2개(안 4, 안 5) 생성 및 boardStore에 저장
5. 매니저(useBandRole 또는 meeting.managerId === currentUserId)만 생성 가능
