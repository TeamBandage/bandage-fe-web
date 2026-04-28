# Task ID: 5

**Title:** 시간표 그리드 에디터 + 드래그 배치

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** 시간표 단건 에디터 구현. 행=일자, 열=30분 슬롯 그리드. 합주 블록 풀에서 곡 블록을 그리드로 드래그-드롭, 30분 스냅.

**Details:**

1. ScheduleBoardEditor.client.tsx 메인 컴포넌트
   - 그리드 시간표: 행=일자(주차), 열=30분 슬롯
   - 좌/우 화살표로 주차 이동
   - 상단 시간 헤더 (09:00~22:00 기본)
2. ScheduleBoardCell.tsx - 30분 셀
   - drop target (onDragOver, onDrop)
   - 블록이 배치된 셀은 색상 표시
3. ScheduleBlockPool.tsx - 우측 합주 블록 풀
   - 확정 곡 한 곡당 1 블록 (중복 사용 가능)
   - 드래그 가능 (draggable, onDragStart)
4. ScheduleBlockChip.tsx - 드래그 가능한 블록 칩
   - HTML5 drag-and-drop API
   - dragstart 시 dataTransfer에 songId 저장
5. useScheduleBoard.ts 훅
   - 현재 board 상태 관리
   - addBlock, moveBlock, removeBlock 액션
   - 30분 슬롯 스냅 로직

```tsx
const handleDrop = (date: string, slot: number) => (e: DragEvent) => {
  const songId = e.dataTransfer.getData('songId');
  if (!songId) return;
  addBlock({ songId, date, startSlot: slot, durationSlots: 4 });
};
```

**Test Strategy:**

1. 블록 풀에서 그리드로 드래그-드롭 동작
2. 30분 슬롯 스냅 정확도
3. 블록 배치 후 시각적 표시
4. 같은 곡 블록 중복 배치 가능
5. 주차 이동 시 그리드 갱신
6. 블록 드래그 중 시각 피드백 (opacity 등)

## Subtasks

### 5.1. useScheduleBoard 훅 및 타입 정의 구현

**Status:** pending  
**Dependencies:** None  

시간표 상태 관리 훅 (useScheduleBoard.ts) 구현. 블록 추가/이동/삭제 액션, 주차 네비게이션, 30분 슬롯 스냅 로직을 포함한 핵심 상태 관리 계층 구축.

**Details:**

1. domain/schedule-coordination/types.ts 에 ScheduleBoard, ScheduleBlock, ScheduleBoardConstraints 인터페이스 추가 (PRD 3-4 참조)
   - boardId, meetingId, name, blocks, pinned, paletteSeed, createdAt, updatedAt
   - ScheduleBlock: blockId, songId, date, startSlot, durationSlots, songTitleOverride, note, pinned, paletteIndex
2. domain/schedule-coordination/hooks/useScheduleBoard.ts 구현
   - useState 기반 board 상태: blocks 배열, weekStart, selectedBlockId
   - addBlock(songId, date, startSlot, durationSlots): 신규 블록 추가, blockId uuid 생성
   - moveBlock(blockId, newDate, newStartSlot): 블록 위치 변경, 30분 슬롯 스냅
   - removeBlock(blockId): 블록 삭제
   - setWeekStart(date): 주차 이동
   - selectBlock(blockId | null): 블록 선택/해제
   - 30분 슬롯 스냅 로직: startSlot = Math.round(dropOffsetMin / 30) → 0~47 범위 클램프
3. 색상 팔레트 헬퍼: domain/schedule-coordination/utils.ts 에 getBlockPaletteColor(songId, paletteSeed) 추가
   - 고정 팔레트: ['accent-dim', 'success-dim', 'warn-dim', 'amber-dim', 'danger-dim', 'card-hover'] 중 songId hash % 6

### 5.2. ScheduleBoardEditor 메인 컴포넌트 및 그리드 구현

**Status:** pending  
**Dependencies:** 5.1  

시간표 그리드 에디터 메인 컴포넌트 구현. 행=일자(주차 7일), 열=30분 슬롯 그리드 렌더링. 좌/우 화살표로 주차 이동, 상단 시간 헤더(09:00~22:00).

**Details:**

1. domain/schedule-coordination/components/ScheduleBoardEditor.client.tsx 생성
   - useScheduleBoard 훅 사용
   - 레이아웃: 좌측 그리드(약 70%) + 우측 블록 풀(약 30%) flex 분할
   - 주차 네비게이션: 상단 ChevronLeft/ChevronRight 버튼 + 중앙 날짜 범위 표시 (weekStart ~ addDays(weekStart, 6))
   - 주차 변경 시 setWeekStart(addDays(weekStart, ±7)) 호출
2. 그리드 테이블 구조
   - 열 헤더: 09:00 ~ 22:00 (slotToTime(18) ~ slotToTime(43)) 30분 간격, 26개 셀
   - 행: 7일 (weekDates = Array.from({length: 7}, (_, i) => addDays(weekStart, i)))
   - 각 셀: ScheduleBoardCell 컴포넌트로 분리
3. ScheduleBoardCell.tsx 컴포넌트
   - props: date, slot, blocks (해당 셀에 배치된 블록들), onDrop 핸들러
   - 기본 스타일: w-10 h-8 border-r border-b bg-card hover:bg-card-hover
   - 블록이 배치된 셀: 블록 색상 적용 + 곡 제목 표시 (span=durationSlots 열 병합)
4. 가용 일자 표시: availableDates 와 매칭되지 않는 날짜 행은 opacity-40 처리

### 5.3. ScheduleBlockPool 및 ScheduleBlockChip 드래그 구현

**Status:** pending  
**Dependencies:** 5.1  

우측 합주 블록 풀 컴포넌트 구현. 확정 곡 목록에서 드래그 가능한 블록 칩 렌더링. HTML5 drag-and-drop API로 dragstart 시 dataTransfer에 songId 저장.

**Details:**

1. domain/schedule-coordination/components/ScheduleBlockPool.tsx 생성
   - props: songs (확정 곡 목록 = isReady(song) 인 곡들), paletteSeed
   - 레이아웃: 세로 스크롤 패널, 상단 제목 '합주곡 블록', 하단 곡 목록
   - 각 곡마다 ScheduleBlockChip 렌더링 (중복 사용 가능 = 풀에서 사라지지 않음)
2. domain/schedule-coordination/components/ScheduleBlockChip.tsx 생성
   - props: song, paletteColor, onDragStart
   - 기본 스타일: 곡 제목, 아티스트, 예상 소요시간(durationSlots 계산 = duration 파싱 or 기본 4슬롯=2시간)
   - draggable="true" 설정
   - onDragStart 핸들러:
     ```tsx
     e.dataTransfer.setData('songId', song.id);
     e.dataTransfer.setData('durationSlots', String(durationSlots));
     e.dataTransfer.effectAllowed = 'move';
     ```
   - 드래그 중 시각 피드백: opacity-50 + cursor-grabbing
3. 색상 적용: getBlockPaletteColor(song.id, paletteSeed) → bg-{color} 클래스
4. 곡 duration 파싱 유틸: parseDurationToSlots(duration?: string) → number
   - 'mm:ss' 형식 파싱 → 슬롯 수 (30분 단위, 최소 2슬롯=1시간, 최대 8슬롯=4시간 제한)

### 5.4. ScheduleBoardCell 드롭 타겟 및 통합 연결

**Status:** pending  
**Dependencies:** 5.2, 5.3  

그리드 셀을 드롭 타겟으로 구현. onDragOver/onDrop 핸들러 추가하여 블록 배치 완료. useScheduleBoard의 addBlock 호출로 상태 업데이트 및 시각적 표시 완성.

**Details:**

1. ScheduleBoardCell.tsx 드롭 핸들러 추가
   - onDragOver: e.preventDefault() + 드래그 중 셀 하이라이트 (border-accent border-2 border-dashed)
   - onDragLeave: 하이라이트 제거
   - onDrop:
     ```tsx
     const handleDrop = (e: DragEvent) => {
       e.preventDefault();
       const songId = e.dataTransfer.getData('songId');
       const durationSlots = Number(e.dataTransfer.getData('durationSlots')) || 4;
       if (!songId) return;
       addBlock({ songId, date, startSlot: slot, durationSlots });
     };
     ```
2. 배치된 블록 렌더링 개선
   - 블록이 차지하는 셀 범위: startSlot ~ startSlot + durationSlots - 1
   - 첫 셀에만 블록 내용 표시 (곡 제목 truncate), 나머지 셀은 같은 색상 연속
   - colSpan 대신 position: absolute + width: calc(슬롯수 * 셀너비) 방식 권장 (테이블 구조 유지)
3. ScheduleBoardEditor 에서 전체 통합
   - useScheduleBoard 훅의 blocks 상태를 그리드에 전달
   - 블록 클릭 시 selectBlock(blockId) 호출 → 선택된 블록 ring-2 ring-accent 표시
   - 블록 삭제: 선택 후 키보드 Delete 또는 우클릭 메뉴 (간단 버전: X 버튼)
4. 드래그 중 전역 피드백: 드래그 시작 시 그리드 영역에 bg-accent/5 오버레이
