# Task ID: 13

**Title:** Auto-rescheduling 엔진 + Working Hours UI + Undo/변경 로그

**Status:** pending

**Dependencies:** 5

**Priority:** medium

**Description:** Reclaim.ai 패턴을 차용하여 시간표 블록 드래그 시 충돌 블록을 BFS 알고리즘으로 자동 재배치하고, Working Hours 제약 UI(슬라이더/토글), 되돌리기 토스트(5초), 변경 로그 사이드 패널을 구현한다.

**Details:**

## 1. ScheduleBoardConstraints 타입 정의
`domain/schedule-coordination/types.ts` 확장:
```ts
export interface ScheduleBoardConstraints {
  workingHoursStart: number;  // 0~47 슬롯, 기본 18 (09:00)
  workingHoursEnd: number;    // 기본 44 (22:00)
  blockedRanges: BlockedRange[];  // 심야·휴식·외부일정
  maxConsecutiveMinutes: number;  // 최대 연속 합주 시간 (분), 기본 180
  excludeWeekends: boolean;
  excludeHolidays: boolean;
}

export interface BlockedRange {
  id: string;
  label: string;           // '점심 휴식', '심야'
  startSlot: number;
  endSlot: number;
  recurring: boolean;      // 매일 반복 여부
  dates?: string[];        // recurring=false 시 특정 일자
}

export interface ScheduleChangeLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'move' | 'add' | 'remove' | 'cascade';
  blockId: string;
  fromSlot?: { date: string; startSlot: number };
  toSlot?: { date: string; startSlot: number };
  affectedBlocks?: string[];  // cascade 시 영향받은 블록 ID
}
```

## 2. BFS 자동 재배치 알고리즘
`domain/schedule-coordination/utils/autoReschedule.ts` 생성:
```ts
import type { ScheduleBlock, ScheduleBoard, ScheduleBoardConstraints } from '../types';
import { isHoliday, isWeekend, slotToMin } from '../utils';

interface PlaceResult {
  success: boolean;
  movedBlocks: Array<{ blockId: string; from: { date: string; startSlot: number }; to: { date: string; startSlot: number } | null }>;
  unscheduledBlocks: string[];
}

export function placeBlock(
  board: ScheduleBoard,
  dropped: ScheduleBlock,
  constraints: ScheduleBoardConstraints,
  practiceWindowEnd: string
): PlaceResult {
  const blocks = [...board.blocks];
  const movedBlocks: PlaceResult['movedBlocks'] = [];
  const unscheduledBlocks: string[] = [];
  
  // 1. dropped 블록 배치
  const existingIdx = blocks.findIndex(b => b.blockId === dropped.blockId);
  if (existingIdx >= 0) blocks[existingIdx] = dropped;
  else blocks.push(dropped);
  
  // 2. 충돌 감지 및 BFS 큐
  const queue = findOverlaps(blocks, dropped).filter(b => !b.pinned && b.blockId !== dropped.blockId);
  const visited = new Set<string>([dropped.blockId]);
  
  while (queue.length > 0) {
    const conflict = queue.shift()!;
    if (visited.has(conflict.blockId)) continue;
    visited.add(conflict.blockId);
    
    const from = { date: conflict.date, startSlot: conflict.startSlot };
    const nextSlot = findNextFreeSlot(blocks, conflict, constraints, practiceWindowEnd);
    
    if (!nextSlot) {
      unscheduledBlocks.push(conflict.blockId);
      movedBlocks.push({ blockId: conflict.blockId, from, to: null });
      continue;
    }
    
    conflict.date = nextSlot.date;
    conflict.startSlot = nextSlot.startSlot;
    movedBlocks.push({ blockId: conflict.blockId, from, to: nextSlot });
    
    // 새 위치에서 추가 충돌 검사
    const newConflicts = findOverlaps(blocks, conflict).filter(b => !b.pinned && !visited.has(b.blockId));
    queue.push(...newConflicts);
  }
  
  return { success: unscheduledBlocks.length === 0, movedBlocks, unscheduledBlocks };
}

function findOverlaps(blocks: ScheduleBlock[], target: ScheduleBlock): ScheduleBlock[] {
  return blocks.filter(b => 
    b.blockId !== target.blockId &&
    b.date === target.date &&
    b.startSlot < target.startSlot + target.durationSlots &&
    b.startSlot + b.durationSlots > target.startSlot
  );
}

function findNextFreeSlot(
  blocks: ScheduleBlock[],
  block: ScheduleBlock,
  constraints: ScheduleBoardConstraints,
  windowEnd: string
): { date: string; startSlot: number } | null {
  let currentDate = block.date;
  let currentSlot = block.startSlot + 1;
  
  while (currentDate <= windowEnd) {
    // Working hours 및 blocked ranges 체크
    if (!isSlotBlocked(currentDate, currentSlot, block.durationSlots, constraints)) {
      if (!hasOverlap(blocks, block.blockId, currentDate, currentSlot, block.durationSlots)) {
        return { date: currentDate, startSlot: currentSlot };
      }
    }
    
    currentSlot++;
    if (currentSlot + block.durationSlots > constraints.workingHoursEnd) {
      currentDate = addDays(currentDate, 1);
      currentSlot = constraints.workingHoursStart;
    }
  }
  return null;
}

function isSlotBlocked(date: string, slot: number, duration: number, constraints: ScheduleBoardConstraints): boolean {
  if (slot < constraints.workingHoursStart || slot + duration > constraints.workingHoursEnd) return true;
  if (constraints.excludeWeekends && isWeekend(date)) return true;
  if (constraints.excludeHolidays && isHoliday(date)) return true;
  return constraints.blockedRanges.some(r => 
    (r.recurring || r.dates?.includes(date)) &&
    slot < r.endSlot && slot + duration > r.startSlot
  );
}
```

## 3. Working Hours UI 컴포넌트
`domain/schedule-coordination/components/WorkingHoursPanel.client.tsx`:
```tsx
'use client';

import { Minus, Plus, Clock, Moon, Coffee } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { slotToTime } from '../utils';
import type { ScheduleBoardConstraints, BlockedRange } from '../types';

interface Props {
  constraints: ScheduleBoardConstraints;
  onChange: (constraints: ScheduleBoardConstraints) => void;
}

export function WorkingHoursPanel({ constraints, onChange }: Props) {
  const [showBreakForm, setShowBreakForm] = useState(false);
  
  const handleSliderChange = (field: 'workingHoursStart' | 'workingHoursEnd', value: number) => {
    onChange({ ...constraints, [field]: value });
  };
  
  const addBreak = (range: Omit<BlockedRange, 'id'>) => {
    onChange({
      ...constraints,
      blockedRanges: [...constraints.blockedRanges, { ...range, id: crypto.randomUUID() }]
    });
  };
  
  return (
    <div className="border-border bg-card rounded-lg border p-s-4 space-y-s-4">
      <div className="flex items-center gap-s-2 text-foreground font-semibold">
        <Clock className="h-4 w-4" />
        Working Hours
      </div>
      
      {/* 슬라이더 - 09:00~22:00 기본 */}
      <div className="space-y-s-2">
        <div className="flex items-center justify-between text-caption">
          <span>시작: {slotToTime(constraints.workingHoursStart)}</span>
          <input
            type="range"
            min={0}
            max={constraints.workingHoursEnd - 2}
            value={constraints.workingHoursStart}
            onChange={(e) => handleSliderChange('workingHoursStart', +e.target.value)}
            className="flex-1 mx-s-3"
          />
        </div>
        <div className="flex items-center justify-between text-caption">
          <span>종료: {slotToTime(constraints.workingHoursEnd)}</span>
          <input
            type="range"
            min={constraints.workingHoursStart + 2}
            max={48}
            value={constraints.workingHoursEnd}
            onChange={(e) => handleSliderChange('workingHoursEnd', +e.target.value)}
            className="flex-1 mx-s-3"
          />
        </div>
      </div>
      
      {/* 심야 배제 토글 */}
      <label className="flex items-center gap-s-2 cursor-pointer">
        <input
          type="checkbox"
          checked={constraints.workingHoursEnd <= 44}
          onChange={(e) => onChange({
            ...constraints,
            workingHoursEnd: e.target.checked ? 44 : 48
          })}
          className="rounded"
        />
        <Moon className="h-4 w-4 text-foreground-muted" />
        <span className="text-caption">심야 배제 (22시 이후)</span>
      </label>
      
      {/* 휴식 시간 목록 */}
      <div className="space-y-s-2">
        <div className="flex items-center justify-between">
          <span className="text-micro text-foreground-muted font-bold uppercase">휴식 시간</span>
          <Button size="xs" variant="ghost" onClick={() => setShowBreakForm(true)}>
            <Plus className="h-3 w-3" /> 추가
          </Button>
        </div>
        {constraints.blockedRanges.map((range) => (
          <div key={range.id} className="flex items-center gap-s-2 text-caption bg-surface rounded px-s-2 py-s-1">
            <Coffee className="h-3 w-3" />
            <span>{range.label}: {slotToTime(range.startSlot)}~{slotToTime(range.endSlot)}</span>
            <button
              onClick={() => onChange({
                ...constraints,
                blockedRanges: constraints.blockedRanges.filter(r => r.id !== range.id)
              })}
              className="ml-auto text-foreground-muted hover:text-danger"
            >
              <Minus className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 4. Undo 토스트 확장
`hooks/useUndoToast.ts`:
```ts
'use client';

import { useCallback, useRef } from 'react';
import { useToastStore } from '@/global/store/toastStore';

interface UndoableAction<T> {
  data: T;
  undo: () => void;
}

export function useUndoToast() {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);
  const undoRef = useRef<(() => void) | null>(null);
  
  const showUndoToast = useCallback(<T>(
    message: string,
    action: UndoableAction<T>,
    duration = 5000
  ) => {
    undoRef.current = action.undo;
    
    const toastId = add({
      type: 'info',
      message: `${message} [되돌리기]`,
      duration
    });
    
    // 5초 후 undo 참조 클리어
    setTimeout(() => {
      if (undoRef.current === action.undo) {
        undoRef.current = null;
      }
    }, duration);
    
    return toastId;
  }, [add]);
  
  const executeUndo = useCallback(() => {
    if (undoRef.current) {
      undoRef.current();
      undoRef.current = null;
    }
  }, []);
  
  return { showUndoToast, executeUndo };
}
```

## 5. 변경 로그 사이드 패널
`domain/schedule-coordination/components/ChangeLogPanel.client.tsx`:
```tsx
'use client';

import { History, Undo2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ScheduleChangeLog } from '../types';
import { slotToTime } from '../utils';

interface Props {
  logs: ScheduleChangeLog[];
  onUndo: (logId: string) => void;
  className?: string;
}

export function ChangeLogPanel({ logs, onUndo, className }: Props) {
  return (
    <aside className={cn('border-border bg-card border-l w-72', className)}>
      <header className="border-border border-b px-s-4 py-s-3 flex items-center gap-s-2">
        <History className="h-4 w-4" />
        <span className="font-semibold">변경 로그</span>
        <span className="text-micro text-foreground-muted">최근 10개</span>
      </header>
      
      <ul className="divide-y divide-border overflow-y-auto max-h-96">
        {logs.slice(0, 10).map((log) => (
          <li key={log.id} className="px-s-4 py-s-3 space-y-s-1">
            <div className="flex items-center justify-between">
              <span className="text-micro text-foreground-muted">
                {new Date(log.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => onUndo(log.id)}
                className="text-accent hover:text-accent-hi text-micro flex items-center gap-1"
              >
                <Undo2 className="h-3 w-3" /> 되돌리기
              </button>
            </div>
            <p className="text-caption">
              {log.action === 'move' && log.fromSlot && log.toSlot && (
                <>블록 이동: {log.fromSlot.date} {slotToTime(log.fromSlot.startSlot)} → {log.toSlot.date} {slotToTime(log.toSlot.startSlot)}</>
              )}
              {log.action === 'cascade' && (
                <>{log.affectedBlocks?.length ?? 0}개 블록 자동 재조정</>
              )}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

## 6. boardStore 확장
`domain/schedule-coordination/store/boardStore.ts`에 constraints, changeLogs, undo 스택 추가:
```ts
interface BoardState {
  boards: Record<string, ScheduleBoard>;
  constraints: Record<string, ScheduleBoardConstraints>;
  changeLogs: Record<string, ScheduleChangeLog[]>;
  undoStack: Record<string, ScheduleBoard[]>;
}

interface BoardActions {
  setConstraints: (boardId: string, constraints: ScheduleBoardConstraints) => void;
  moveBlockWithCascade: (boardId: string, block: ScheduleBlock, practiceWindowEnd: string) => PlaceResult;
  addChangeLog: (boardId: string, log: Omit<ScheduleChangeLog, 'id' | 'timestamp'>) => void;
  undo: (boardId: string) => void;
}
```

## 7. 드래그 핸들러 통합
`useScheduleBoard.ts` 훅의 onDrop 핸들러에서 `placeBlock` 호출:
```ts
const handleDrop = (date: string, slot: number, songId: string) => {
  const snapshot = JSON.parse(JSON.stringify(board)); // undo용 스냅샷
  
  const newBlock: ScheduleBlock = {
    blockId: crypto.randomUUID(),
    songId,
    date,
    startSlot: slot,
    durationSlots: 4, // 2시간 기본
    pinned: false,
    paletteIndex: getPaletteIndex(songId)
  };
  
  const result = placeBlock(board, newBlock, constraints, practiceWindowEnd);
  
  if (result.movedBlocks.length > 1) {
    // cascade 발생
    addChangeLog(boardId, {
      userId: currentUserId,
      action: 'cascade',
      blockId: newBlock.blockId,
      affectedBlocks: result.movedBlocks.map(m => m.blockId)
    });
    
    showUndoToast(
      `${result.movedBlocks.length - 1}개 블록이 자동 재조정되었습니다`,
      { data: snapshot, undo: () => restoreBoard(boardId, snapshot) }
    );
  }
  
  updateBoard(boardId, result);
};
```

**Test Strategy:**

## 단위 테스트

1. **BFS 재배치 알고리즘 테스트** (`autoReschedule.test.ts`)
   - 단일 블록 드롭 시 충돌 없는 경우 정상 배치
   - 2개 블록 충돌 시 후속 블록 다음 슬롯으로 이동
   - 3개 이상 연쇄 충돌 시 BFS 순서대로 재배치
   - pinned 블록은 이동하지 않고 새 블록이 회피
   - Working Hours 외부 슬롯은 건너뛰기
   - 합주 기간 초과 시 unscheduled 처리

2. **isSlotBlocked 함수 테스트**
   - workingHoursStart/End 경계 테스트
   - blockedRanges 반복/단발 테스트
   - 주말/공휴일 제외 테스트

## 통합 테스트

3. **Working Hours UI 테스트**
   - 슬라이더 조작 시 constraints 업데이트
   - 심야 배제 토글 시 workingHoursEnd 44로 변경
   - 휴식 시간 추가/삭제 동작

4. **Undo 토스트 테스트**
   - 드롭 후 5초 내 되돌리기 클릭 시 이전 상태 복원
   - 5초 경과 후 undo 불가
   - 다중 드롭 시 가장 최근 작업만 undo

5. **변경 로그 패널 테스트**
   - 로그 10개 제한 표시
   - 시간순 정렬 (최신 상단)
   - 개별 로그 undo 클릭 시 해당 작업 되돌리기

## E2E 테스트

6. **드래그 재배치 시나리오**
   - 블록 A를 블록 B 위치로 드래그 → B 자동 이동 확인
   - 연쇄 충돌 시 부드러운 애니메이션 (200ms transition)
   - 충돌 해소 불가 블록 빨간 외곽선 표시
   - unscheduled 블록 우측 풀로 이동

7. **Working Hours 시각화**
   - 비활성 셀 stripe 패턴 표시
   - 비활성 영역 드롭 시도 시 cursor: not-allowed
   - 자동 재배치가 비활성 영역 회피

8. **모바일 반응형**
   - Working Hours 패널이 BottomSheet로 전환
   - 변경 로그 패널 하단 시트로 전환

## Subtasks

### 13.1. ScheduleBoardConstraints/Block/ChangeLog 타입 정의 및 BFS 자동 재배치 알고리즘 구현

**Status:** pending  
**Dependencies:** None  

시간표 보드 제약 조건(Working Hours, 차단 범위 등), 블록, 변경 로그 타입을 정의하고, 충돌 시 BFS 알고리즘으로 블록을 자동 재배치하는 placeBlock 함수를 구현한다.

**Details:**

## 구현 내용

### 1. types.ts 확장
`domain/schedule-coordination/types.ts`에 다음 타입 추가:
- `ScheduleBoardConstraints`: workingHoursStart/End (0~47 슬롯), blockedRanges[], maxConsecutiveMinutes, excludeWeekends, excludeHolidays
- `BlockedRange`: id, label, startSlot, endSlot, recurring, dates?
- `ScheduleBlock`: blockId, songId, date, startSlot, durationSlots, pinned, paletteIndex
- `ScheduleBoard`: boardId, meetingId, blocks[], createdAt, updatedAt
- `ScheduleChangeLog`: id, timestamp, userId, action('move'|'add'|'remove'|'cascade'), blockId, fromSlot?, toSlot?, affectedBlocks?
- `PlaceResult`: success, movedBlocks[], unscheduledBlocks[]

### 2. autoReschedule.ts 생성
`domain/schedule-coordination/utils/autoReschedule.ts` 파일 생성:
- `placeBlock(board, dropped, constraints, practiceWindowEnd)`: 드롭된 블록을 배치하고 충돌 시 BFS로 후속 블록 재배치
- `findOverlaps(blocks, target)`: 겹치는 블록 탐색
- `findNextFreeSlot(blocks, block, constraints, windowEnd)`: Working Hours/차단 범위 고려하여 다음 빈 슬롯 탐색
- `isSlotBlocked(date, slot, duration, constraints)`: 슬롯 차단 여부 판정 (working hours, 주말, 공휴일, blockedRanges)
- `hasOverlap(blocks, blockId, date, slot, duration)`: 특정 위치에 다른 블록과 겹침 여부

### 주의사항
- utils.ts의 기존 isWeekend, isHoliday, addDays 함수 활용
- pinned 블록은 이동 대상에서 제외
- practiceWindowEnd를 초과하면 unscheduledBlocks로 처리

### 13.2. boardStore 생성 및 constraints/changeLogs/undo 스택 관리

**Status:** pending  
**Dependencies:** 13.1  

시간표 보드 상태를 관리하는 Zustand store를 생성하고, 제약 조건, 변경 로그, undo 스택을 포함한 상태/액션을 구현한다.

**Details:**

## 구현 내용

### boardStore.ts 생성
`domain/schedule-coordination/store/boardStore.ts` 파일 생성:

```ts
interface BoardState {
  boards: Record<string, ScheduleBoard>;
  constraints: Record<string, ScheduleBoardConstraints>;
  changeLogs: Record<string, ScheduleChangeLog[]>;
  undoStack: Record<string, ScheduleBoard[]>; // 보드별 스냅샷 스택
}

interface BoardActions {
  // Board CRUD
  getBoard: (boardId: string) => ScheduleBoard | undefined;
  createBoard: (meetingId: string) => string; // boardId 반환
  updateBoard: (boardId: string, board: ScheduleBoard) => void;
  deleteBoard: (boardId: string) => void;
  
  // Constraints
  getConstraints: (boardId: string) => ScheduleBoardConstraints;
  setConstraints: (boardId: string, constraints: ScheduleBoardConstraints) => void;
  
  // Block operations with cascade
  moveBlockWithCascade: (boardId: string, block: ScheduleBlock, practiceWindowEnd: string) => PlaceResult;
  addBlock: (boardId: string, block: ScheduleBlock) => void;
  removeBlock: (boardId: string, blockId: string) => void;
  togglePinBlock: (boardId: string, blockId: string) => void;
  
  // Change logs
  addChangeLog: (boardId: string, log: Omit<ScheduleChangeLog, 'id' | 'timestamp'>) => void;
  getChangeLogs: (boardId: string) => ScheduleChangeLog[];
  
  // Undo
  pushSnapshot: (boardId: string) => void;
  undo: (boardId: string) => boolean; // 성공 여부
  canUndo: (boardId: string) => boolean;
}
```

### 기본 Constraints 상수
```ts
export const DEFAULT_CONSTRAINTS: ScheduleBoardConstraints = {
  workingHoursStart: 18, // 09:00
  workingHoursEnd: 44,   // 22:00
  blockedRanges: [],
  maxConsecutiveMinutes: 180,
  excludeWeekends: false,
  excludeHolidays: false,
};
```

### localStorage 영속화
- `persist` 미들웨어로 boards, constraints 영속화
- changeLogs는 최근 50개만 유지
- undoStack은 보드당 최대 10개 스냅샷

### 13.3. Working Hours UI 컴포넌트 및 Undo 토스트 훅 구현

**Status:** pending  
**Dependencies:** 13.2  

Working Hours 설정 패널(슬라이더, 토글, 휴식 시간 관리)과 되돌리기 액션이 포함된 Undo 토스트 훅을 구현한다.

**Details:**

## 구현 내용

### 1. WorkingHoursPanel.client.tsx
`domain/schedule-coordination/components/WorkingHoursPanel.client.tsx`:
- 시작/종료 시간 슬라이더 (0~47 슬롯, 기본 09:00~22:00)
- 심야 배제 토글 (22시 이후 자동 차단)
- 주말 배제 토글
- 공휴일 배제 토글
- 휴식 시간(BlockedRange) 추가/삭제 UI
  - label 입력, 시작/종료 슬롯 선택, recurring 토글
- slotToTime 유틸로 슬롯을 시간 문자열로 표시
- onChange 콜백으로 constraints 변경 전파

### 2. useUndoToast.ts 훅
`hooks/useUndoToast.ts`:
```ts
interface UndoableAction<T> {
  data: T;
  undo: () => void;
}

export function useUndoToast() {
  const { add, remove } = useToastStore();
  const undoRef = useRef<(() => void) | null>(null);
  
  const showUndoToast = <T>(
    message: string,
    action: UndoableAction<T>,
    duration = 5000
  ) => {
    undoRef.current = action.undo;
    // 토스트 표시 + 5초 후 참조 클리어
  };
  
  const executeUndo = () => {
    if (undoRef.current) {
      undoRef.current();
      undoRef.current = null;
    }
  };
  
  return { showUndoToast, executeUndo };
}
```

### 3. 토스트 메시지 형식
- '{N}개 블록이 자동 재조정되었습니다 [되돌리기]'
- 5초 지속, 클릭 시 undo 실행

### 13.4. 변경 로그 사이드 패널 및 드래그 핸들러 통합

**Status:** pending  
**Dependencies:** 13.3  

변경 로그 사이드 패널 UI를 구현하고, 드래그-드롭 핸들러에서 placeBlock/boardStore/undoToast를 통합하여 cascade 재배치 흐름을 완성한다.

**Details:**

## 구현 내용

### 1. ChangeLogPanel.client.tsx
`domain/schedule-coordination/components/ChangeLogPanel.client.tsx`:
- 최근 10개 변경 로그 표시
- 각 항목: timestamp(HH:mm), action 설명, 되돌리기 버튼
- action별 표시:
  - 'move': '블록 이동: {from.date} {slotToTime(from.startSlot)} → {to.date} {slotToTime(to.startSlot)}'
  - 'cascade': '{N}개 블록 자동 재조정'
  - 'add': '블록 추가: {songTitle} @ {date}'
  - 'remove': '블록 삭제: {songTitle}'
- onUndo(logId) 콜백으로 특정 변경 되돌리기

### 2. useScheduleBoard.ts 훅 확장
`domain/schedule-coordination/hooks/useScheduleBoard.ts`:
```ts
const handleDrop = (date: string, slot: number, songId: string) => {
  const snapshot = JSON.parse(JSON.stringify(board));
  pushSnapshot(boardId);
  
  const newBlock: ScheduleBlock = {
    blockId: crypto.randomUUID(),
    songId,
    date,
    startSlot: slot,
    durationSlots: 4, // 2시간 기본
    pinned: false,
    paletteIndex: getPaletteIndex(songId)
  };
  
  const result = placeBlock(board, newBlock, constraints, practiceWindowEnd);
  
  if (result.movedBlocks.length > 1) {
    addChangeLog(boardId, {
      userId: currentUserId,
      action: 'cascade',
      blockId: newBlock.blockId,
      affectedBlocks: result.movedBlocks.map(m => m.blockId)
    });
    
    showUndoToast(
      `${result.movedBlocks.length - 1}개 블록이 자동 재조정되었습니다`,
      { data: snapshot, undo: () => undo(boardId) }
    );
  }
  
  updateBoard(boardId, { ...board, blocks: applyMoves(board.blocks, result) });
};
```

### 3. ScheduleBoardEditor 통합
Task 5에서 구현될 ScheduleBoardEditor.client.tsx의 onDrop 핸들러에 연결 준비:
- WorkingHoursPanel을 에디터 사이드바에 배치
- ChangeLogPanel을 우측 또는 하단 접이식 패널로 배치
