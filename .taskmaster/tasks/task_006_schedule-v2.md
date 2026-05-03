# Task ID: 6

**Title:** 시간표 블록 상세 패널 + 컬러 팔레트

**Status:** pending

**Dependencies:** 5

**Priority:** medium

**Description:** 시간표 블록 클릭 시 우측 상세 패널. 곡명 수정, 메모, 고정 토글, 삭제. 디자인 토큰 기반 6-8종 컬러 팔레트, 곡별 hash로 색상 안정 매핑.

**Details:**

1. ScheduleBlockPanel.tsx - 우측 상세 패널
   - 곡명 (songTitleOverride 수정 가능)
   - 메모 입력 (Textarea)
   - '고정' 토글 (자동 재생성 시 위치 보존)
   - 삭제 버튼
2. lib/schedule-palette.ts 컬러 팔레트 정의
```ts
const PALETTE = [
  'bg-accent-dim',
  'bg-success-dim', 
  'bg-warn-dim',
  'bg-amber-dim',
  'bg-danger-dim',
  'bg-card-hover',
  // 추가 2종
];

export function getSongColor(songId: string, paletteSeed: number): string {
  const hash = hashString(songId + paletteSeed);
  return PALETTE[hash % PALETTE.length];
}
```
3. 블록 렌더링 시 getSongColor로 배경색 적용
4. 같은 곡은 항상 같은 색 (songId + board.paletteSeed hash)
5. updateBlock 액션으로 수정사항 저장

```tsx
<ScheduleBlockPanel
  block={selectedBlock}
  onUpdate={(patch) => updateBlock(block.blockId, patch)}
  onDelete={() => removeBlock(block.blockId)}
  onClose={() => setSelectedBlock(null)}
/>
```

**Test Strategy:**

1. 블록 클릭 시 패널 열림
2. 곡명 수정 후 저장 반영
3. 메모 입력 및 저장
4. 고정 토글 동작
5. 삭제 후 그리드에서 블록 제거
6. 같은 곡 여러 배치 시 동일 색상

## Subtasks

### 6.1. 컬러 팔레트 유틸 함수 (lib/schedule-palette.ts) 구현

**Status:** pending  
**Dependencies:** None  

디자인 토큰 기반 6-8종 컬러 팔레트 정의 및 songId hash 기반 색상 안정 매핑 함수 구현

**Details:**

src/lib/schedule-palette.ts 파일 생성. globals.css의 기존 토큰(accent-dim, success-dim, warn-dim, amber-dim, danger-dim, card-hover) 활용하여 PALETTE 배열 정의. hashString 유틸 구현 - 간단한 DJB2 또는 FNV 해시 알고리즘 사용. getSongColor(songId: string, paletteSeed: number): string 함수 구현 - (hashString(songId + paletteSeed) % PALETTE.length) 로 인덱스 결정. 팔레트 확장을 위해 추가 2종 색상(예: violet-dim, teal-dim) 정의 필요시 globals.css @theme 섹션에 신규 토큰 추가

### 6.2. ScheduleBlockPanel.tsx 상세 패널 컴포넌트 구현

**Status:** pending  
**Dependencies:** 6.1  

시간표 블록 클릭 시 우측에 표시되는 상세 패널 컴포넌트 - 곡명 수정, 메모, 고정 토글, 삭제 기능 포함

**Details:**

src/domain/schedule-coordination/components/ScheduleBlockPanel.tsx 생성. Props 정의: block(현재 선택 블록), onUpdate(patch 콜백), onDelete, onClose. UI 구성: 기존 Input 컴포넌트로 songTitleOverride 수정 필드, Textarea 컴포넌트로 메모 입력, 커스텀 토글 버튼으로 '고정(pinned)' 상태 토글(자동 재생성 시 위치 보존), Button variant='danger'로 삭제 버튼. 패널 스타일: bg-card border-border rounded-lg p-4, 우측 사이드바 형태. 수정 시 debounce 적용하여 onUpdate 호출 빈도 제한. 삭제 전 ConfirmDialog 표시

### 6.3. scheduleStore에 ScheduleBoard 타입 및 블록 관리 액션 추가

**Status:** pending  
**Dependencies:** None  

시간표 보드 타입(ScheduleBoard, ScheduleBlock) 정의 및 updateBlock, removeBlock 액션 구현

**Details:**

src/domain/schedule-coordination/types.ts에 타입 추가: ScheduleBlock (blockId, songId, songTitleOverride, date, startSlot, endSlot, note, pinned), ScheduleBoard (boardId, meetingId, paletteSeed, blocks, confirmedAt). scheduleStore.ts 확장: boards: Record<string, ScheduleBoard> 상태 추가, updateBlock(boardId, blockId, patch: Partial<ScheduleBlock>) 액션 - 특정 블록 필드 업데이트, removeBlock(boardId, blockId) 액션 - 블록 배열에서 해당 블록 제거, selectedBlockId 상태 + setSelectedBlock 액션 추가로 현재 선택 블록 관리

### 6.4. 시간표 블록 렌더링에 컬러 팔레트 적용 및 패널 연동

**Status:** pending  
**Dependencies:** 6.1, 6.2, 6.3  

시간표 그리드의 블록 렌더링 시 getSongColor 적용 및 블록 클릭 시 ScheduleBlockPanel 연동

**Details:**

ScheduleBoardEditor.client.tsx(Task 5 산출물 예정) 또는 해당 블록 렌더링 컴포넌트에서 getSongColor(block.songId, board.paletteSeed) 호출하여 배경색 적용. 블록 클릭 이벤트 핸들러: setSelectedBlock(block.blockId) 호출. 조건부 렌더링: selectedBlockId 존재 시 우측에 ScheduleBlockPanel 표시. 패널 onUpdate 콜백에서 scheduleStore.updateBlock 호출, onDelete에서 removeBlock 호출 후 setSelectedBlock(null). 패널 외부 클릭 또는 Esc 키로 패널 닫기 처리. 같은 songId 블록은 항상 동일 색상으로 시각적 일관성 확보
