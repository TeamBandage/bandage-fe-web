# Task ID: 8

**Title:** 시간표 확정 및 게이지 색상 전환

**Status:** pending

**Dependencies:** 6

**Priority:** high

**Description:** 매니저의 시간표 확정 기능. 단일 board만 confirmed 가능. 확정 시 진행도 게이지 bg-success 전환. 확정 후 수정 시 경고.

**Details:**

1. boardStore에 confirmBoard 액션 추가
   - 다른 board confirmed=false 처리
   - 선택 board confirmed=true
2. '합주 시간표 확정' 버튼 (헤더 우측)
   - ConfirmDialog로 확인
   - 확정 시 toast 알림
3. 확정 상태 시각화:
   - ListPane 회의 카드 게이지: bg-success
   - 메인 헤더 게이지: bg-success
   - 카드에 '확정됨' 배지
4. 확정된 board 수정 시:
   - 경고 모달: "확정된 시간표를 수정하시겠습니까?"
   - 확인 시 confirmed=false + 수정 진행
5. Meeting 타입 확장: confirmedBoardId?: string

```tsx
const confirmBoard = (boardId: string) => set((state) => ({
  boards: Object.fromEntries(
    Object.entries(state.boards).map(([id, b]) => [
      id,
      { ...b, confirmed: id === boardId }
    ])
  )
}));
```

**Test Strategy:**

1. 확정 버튼 클릭 시 다이얼로그 표시
2. 확정 후 게이지 색상 bg-success 전환
3. 이미 확정된 상태에서 다른 board 확정 시 기존 해제
4. 확정된 board 수정 시 경고
5. 비매니저는 확정 버튼 비표시

## Subtasks

### 8.1. Board 타입 정의 및 boardStore 생성 (confirmBoard 액션 포함)

**Status:** pending  
**Dependencies:** None  

시간표 카드(Board) 데이터 모델 타입을 정의하고, Zustand store를 생성하여 board 관리 및 확정 기능을 구현합니다.

**Details:**

1. domain/schedule-coordination/types.ts에 ScheduleBoard 타입 추가:
   - id: string, meetingId: string, name: string, slots: ScheduleSlot[], confirmed: boolean, createdAt: string, updatedAt: string
   - ScheduleSlot: { date: string, startMin: number, endMin: number, songIds: string[] }

2. domain/schedule-coordination/store/boardStore.ts 생성:
   - State: boards: Record<string, ScheduleBoard[]> (meetingId → boards)
   - Actions:
     * addBoard(meetingId, board) - 새 시간표 추가
     * updateBoard(meetingId, boardId, patch) - 시간표 수정
     * deleteBoard(meetingId, boardId) - 시간표 삭제
     * confirmBoard(meetingId, boardId) - 단일 board만 confirmed=true, 나머지 false
     * unconfirmBoard(meetingId, boardId) - 확정 해제
   - persist 미들웨어 적용 (key: 'bandage-schedule-boards-v1')
   - Selector: useConfirmedBoard(meetingId) - confirmed=true인 board 반환

3. confirmBoard 핵심 로직:
```tsx
confirmBoard: (meetingId, boardId) => set((state) => ({
  boards: {
    ...state.boards,
    [meetingId]: (state.boards[meetingId] ?? []).map((b) => ({
      ...b,
      confirmed: b.id === boardId,
      updatedAt: new Date().toISOString(),
    })),
  },
})),
```

### 8.2. '합주 시간표 확정' 버튼 및 ConfirmDialog 구현

**Status:** pending  
**Dependencies:** 8.1  

매니저 전용 시간표 확정 버튼을 헤더에 추가하고, ConfirmDialog를 통한 확인 후 toast 알림을 표시합니다.

**Details:**

1. SchedulingMain.client.tsx 헤더 영역에 '합주 시간표 확정' 버튼 추가:
   - isManager && confirmedBoard가 없을 때만 표시
   - 선택된 board가 있어야 활성화
   - 버튼 스타일: bg-success hover:bg-success/90 text-white
   - 아이콘: CheckCircle2 (lucide-react)

2. ConfirmDialog 연동:
   - title: '합주 시간표 확정'
   - description: `"${selectedBoard.name}" 시간표를 확정하시겠습니까? 확정 후에는 수정 시 경고가 표시됩니다.`
   - confirmLabel: '확정'
   - tone: 'primary'

3. 확정 처리:
   - confirmBoard(meetingId, selectedBoardId) 호출
   - toast.success('시간표가 확정되었습니다.')
   - setConfirmOpen(false)

4. 이미 확정된 상태 표시:
   - 헤더에 '확정됨' 배지 표시 (bg-success-dim text-success)
   - 확정된 board 이름 표시

### 8.3. 확정 상태 시각화 (게이지 bg-success 전환 및 '확정됨' 배지)

**Status:** pending  
**Dependencies:** 8.1  

시간표 확정 시 ListPane의 회의 카드 게이지와 메인 헤더 게이지를 bg-success로 전환하고, 카드에 '확정됨' 배지를 표시합니다.

**Details:**

1. SetlistMeetingsListPane.client.tsx 수정:
   - MeetingRow 컴포넌트에서 confirmedBoard 여부 확인
   - useConfirmedBoard(meeting.id) 또는 meeting.confirmedSlot 체크
   - 확정된 경우 progress bar 색상 변경:
     * 기존: bg-accent
     * 확정: bg-success
   - 카드 우측에 '확정됨' 배지 추가:
     ```tsx
     {isConfirmed && (
       <span className="bg-success-dim text-success text-micro px-s-2 rounded-full py-0.5 font-bold">
         확정됨
       </span>
     )}
     ```

2. SchedulingMain.client.tsx 헤더 게이지 수정:
   - 기존 진행도 게이지에 확정 상태 반영
   - 확정 시: bg-success, 미확정 시: bg-accent

3. SchedulingListPane (Task 1에서 생성 예정) 동일 패턴 적용:
   - 회의 카드 게이지 색상 조건부 렌더링
   - confirmedBoard 존재 시 bg-success

4. CSS 토큰 활용:
   - bg-success: oklch(0.7 0.18 155)
   - bg-success-dim: oklch(0.7 0.18 155 / 0.15)
   - text-success: 동일 색상

### 8.4. 확정된 board 수정 시 경고 모달 구현

**Status:** pending  
**Dependencies:** 8.1, 8.2  

이미 확정된 시간표를 수정하려 할 때 경고 모달을 표시하고, 확인 시 confirmed=false로 변경 후 수정을 진행합니다.

**Details:**

1. ScheduleBoardEditor.client.tsx (또는 시간표 편집 컴포넌트)에 경고 로직 추가:
   - board.confirmed === true 상태에서 편집 시도 감지
   - 편집 시도 훅: useEditGuard(board) 또는 인라인 체크

2. 경고 모달 (ConfirmDialog 재사용):
   - title: '확정된 시간표 수정'
   - description: '확정된 시간표를 수정하시겠습니까? 수정 시 확정 상태가 해제됩니다.'
   - confirmLabel: '수정하기'
   - cancelLabel: '취소'
   - tone: 'danger'

3. 수정 진행 로직:
   ```tsx
   const handleEditConfirmed = () => {
     unconfirmBoard(meetingId, boardId);
     toast.warn('시간표 확정이 해제되었습니다.');
     // 수정 모드 진입
     setEditMode(true);
   };
   ```

4. 편집 진입점들에 가드 적용:
   - 슬롯 드래그/추가 시
   - 시간표 이름 변경 시
   - 슬롯 삭제 시
   - 블록(곡) 이동/재배치 시

5. UX 고려사항:
   - 경고 모달은 세션당 한 번만 표시 옵션 (체크박스)
   - 또는 매번 표시하되 간결한 메시지
