# Task ID: 9

**Title:** 나의 스케줄 입력 모달 v2

**Status:** pending

**Dependencies:** 7

**Priority:** high

**Description:** PRD §5-B 기반 전면 개선: 4단계 플로우 재배열 + PointerEvent 기반 드래그 페인트 + 시간 프리셋 칩 + Copy & Repeat(전주/모든주/요일) + 24h/9-22 토글 + 실시간 요약 푸터 + Smart Defaults. input-mode 탭 제거, 외부 캘린더/AI 채우기 비범위.

**Details:**

## 참조 파일
- `src/app/(main)/setlist-meetings/scheduling/[meetingId]/ScheduleInputModal.client.tsx` — 현재 5단계 모달
- `src/domain/schedule-coordination/store/scheduleStore.ts` — DEFAULT_DAY_MASK, persist
- `src/domain/schedule-coordination/utils.ts` — dayOfWeek, slotToTime, addDays 등
- `src/domain/schedule-coordination/types.ts` — SlotMask, MemberSchedule

## 구현 개요

### 9-A 셀 입력 — PointerEvent 드래그 페인트
- PointerEvent 기반(mousedown 대신) — 터치/펜 지원
- 수직/대각선 자유 영역 페인트
- 첫 셀 상태 기반 set/unset 모드 결정
- `<table>` → `table-fixed` + `<col>` 로 셀 너비 균등화

### 9-B 시간 프리셋 칩
- 오전(09-12) / 점심(12-14) / 오후(14-18) / 저녁(19-22) / 심야(22-02) 5개
- Shift+클릭 = 해당 mask만 남기기(replace)
- Alt+클릭 = 해당 mask 제거
- localStorage 빈도 추적 → 자주 쓰는 칩 상단 고정

### 9-C Copy & Repeat
- '전 주와 동일' 버튼 — 직전 주차 mask 복제
- '모든 주차에 적용' 버튼 — 현재 주차 패턴 브로드캐스트 (확인 다이얼로그)
- '요일 복사 → 다른 요일' — 일자 라벨 ⋯ 메뉴
- 키보드: Cmd+C(복사) / Cmd+V(붙여넣기) / Cmd+Z(undo, 최대 10개 history)

### 9-D 24h/9-22 토글
- 헤더 토글 버튼: '9-22' / '24h'
- 24h 모드 — 48슬롯 가로 스크롤, 스크롤 위치 메모
- 9-22 모드 — working-hours 외부 셀 stripe + cursor not-allowed

### 9-E 실시간 요약 푸터
- 형식: '선택: 12시간 / 5일 / 멤버 평균 14시간'
- 입력 즉시 갱신 (useMemo 기반 계산)

### 9-F Smart Defaults
- 첫 진입 시 '평일 저녁 + 주말 종일' 프리셋 자동 적용
- '비우고 시작' 버튼 제공
- 사용자가 한 번 무시하면 다음부터 비활성(localStorage 플래그)

### 9-G 4단계 플로우
- STEPS: ['가능 일자', '시간 블록', '특이사항', '확인']
- Step 타입: 0 | 1 | 2 | 3
- prev/next 키보드 화살표 지원
- Step0InputMode 컴포넌트 및 inputMode 상태 제거

## 코드 스니펫

```tsx
// 9-A PointerEvent 드래그
const [dragMode, setDragMode] = useState<'set' | 'unset' | null>(null);

const handlePointerDown = (e: React.PointerEvent, date: string, slot: number) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  const current = blocks[date]?.[slot] ?? false;
  setDragMode(current ? 'unset' : 'set');
  applySlot(date, slot, !current);
};

const handlePointerMove = (e: React.PointerEvent, date: string, slot: number) => {
  if (!dragMode || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
  applySlot(date, slot, dragMode === 'set');
};

const handlePointerUp = (e: React.PointerEvent) => {
  e.currentTarget.releasePointerCapture(e.pointerId);
  setDragMode(null);
};
```

```tsx
// 9-B 프리셋 칩
const TIME_PRESETS = [
  { id: 'morning', label: '오전', start: 18, end: 24 },   // 09:00-12:00
  { id: 'lunch', label: '점심', start: 24, end: 28 },     // 12:00-14:00
  { id: 'afternoon', label: '오후', start: 28, end: 36 }, // 14:00-18:00
  { id: 'evening', label: '저녁', start: 38, end: 44 },   // 19:00-22:00
  { id: 'night', label: '심야', start: 44, end: 4 },      // 22:00-02:00 (wrap)
] as const;
```

**Test Strategy:**

## 단위 테스트
1. PointerEvent 드래그 — set/unset 모드 결정 정확성
2. 시간 프리셋 칩 — OR/replace/remove 동작 검증
3. Copy & Repeat — 주차 간 mask 복제 정확성
4. Undo history — 최대 10개 제한 및 복원 정확성
5. 실시간 요약 계산 — 총 시간/일수 정확성

## 통합 테스트
1. 4단계 진행바 표시 및 단계 전환
2. 드래그로 연속 슬롯 선택/해제
3. 마지막 슬롯 셀 크기 동일 확인
4. 24h/9-22 토글 시 레이아웃 변경
5. 키보드 화살표로 단계 이동
6. Cmd+C/V/Z 키보드 단축키 동작
7. Smart Default 첫 진입 시 자동 적용
8. '비우고 시작' 클릭 시 초기화
9. localStorage 프리셋 빈도 추적
10. 기존 저장 데이터 정상 로드
11. 완료 후 completed 상태 true

## Subtasks

### 9.1. 9-G 4단계 플로우 — Step 0 제거 및 스텝 재배열

**Status:** pending  
**Dependencies:** None  

STEPS 상수에서 '입력 방식' 제거, Step 타입 0~3으로 변경, ProgressBar 및 스텝 전환 로직 수정, prev/next 키보드 화살표 지원 추가

**Details:**

1. `STEPS` 상수 변경: `['입력 방식', '가능 일자', '시간 블록', '특이사항', '확인']` → `['가능 일자', '시간 블록', '특이사항', '확인']`
2. `Step` 타입 변경: `0 | 1 | 2 | 3 | 4` → `0 | 1 | 2 | 3`
3. `step` 초기값 및 `next()/back()` 함수의 경계값 수정 (최대 3)
4. `Step0InputMode` 컴포넌트 및 관련 상태(`inputMode`) 제거
5. 렌더링 조건 수정: `step === 0`은 `Step1Dates`, `step === 1`은 `Step2Blocks` 등으로 재매핑
6. `Step4Review`에서 `inputMode` prop 제거 및 해당 표시 라인 삭제
7. `wasOpenRef` 초기화 시 `setInputMode` 호출 제거
8. 푸터의 `disabled={step === 0 && inputMode === 'ai'}` 조건 제거
9. 키보드 이벤트 리스너 추가: ArrowLeft → back(), ArrowRight → next()
10. useEffect cleanup으로 키보드 리스너 정리

### 9.2. 9-A 셀 입력 — PointerEvent 드래그 페인트 + 셀 균등화

**Status:** pending  
**Dependencies:** 9.1  

Step2Blocks에 PointerEvent 기반 드래그 입력 구현, 수직/대각선 영역 페인트, 터치 지원, 마지막 슬롯 split-cell 버그 수정

**Details:**

1. `Step2Blocks`에 `dragMode` 상태 추가: `useState<'set' | 'unset' | null>(null)`
2. `handlePointerDown(e, date, slot)` 함수 구현:
   - `e.currentTarget.setPointerCapture(e.pointerId)` 호출
   - 현재 셀 상태 확인 후 dragMode 설정
   - 해당 셀 상태 즉시 적용
3. `handlePointerMove(e, date, slot)` 함수 구현:
   - `hasPointerCapture` 체크로 드래그 중인지 확인
   - dragMode에 따라 셀 상태 적용
4. `handlePointerUp(e)` 함수: `releasePointerCapture` + `setDragMode(null)`
5. 테이블 레이아웃 수정:
   - `<table className="table-fixed w-full">` 적용
   - `<colgroup>` 추가하여 열별 너비 명시:
     ```tsx
     <colgroup>
       <col className="w-16" /> {/* 날짜 열 */}
       {Array.from({ length: 26 }, (_, i) => (
         <col key={i} className="w-6" />
       ))}
     </colgroup>
     ```
6. 셀에 `touch-action: none` 스타일 추가 (터치 스크롤 방지)
7. `user-select: none` 추가 (텍스트 선택 방지)

### 9.3. 9-B 시간 프리셋 칩 — Reclaim Habits 패턴

**Status:** pending  
**Dependencies:** 9.1, 9.2  

오전/점심/오후/저녁/심야 5개 프리셋 칩 구현, Shift(replace)/Alt(remove) modifier 지원, localStorage 빈도 추적으로 자주 쓰는 칩 상단 고정

**Details:**

1. `TIME_PRESETS` 상수 정의:
   ```tsx
   const TIME_PRESETS = [
     { id: 'morning', label: '오전', start: 18, end: 24 },   // 09:00-12:00
     { id: 'lunch', label: '점심', start: 24, end: 28 },     // 12:00-14:00
     { id: 'afternoon', label: '오후', start: 28, end: 36 }, // 14:00-18:00
     { id: 'evening', label: '저녁', start: 38, end: 44 },   // 19:00-22:00
     { id: 'night', label: '심야', start: 44, end: 4 },      // 22:00-02:00 (wrap)
   ] as const;
   ```
2. `TimePresetChips` 컴포넌트 생성 (Step2Blocks 상단에 배치)
3. 클릭 핸들러 구현:
   - 기본 클릭: 선택된 일자에 해당 시간 mask OR 적용
   - Shift+클릭: 해당 mask만 남기기 (replace)
   - Alt+클릭: 해당 mask 영역 제거
4. localStorage 빈도 추적:
   - key: `bandage-preset-freq`
   - 구조: `{ [presetId]: number }`
   - 클릭 시 해당 프리셋 count 증가
5. 칩 정렬: 빈도 상위 3개는 'Quick' prefix + 상단 고정
6. 심야(22-02) wrap 처리: slot 44~47 + 0~3 범위 적용

### 9.4. 9-C Copy & Repeat — 전주/모든주/요일 복사 + 키보드 단축키

**Status:** pending  
**Dependencies:** 9.1, 9.2  

'전 주와 동일'/'모든 주차에 적용'/'요일 복사' 버튼 구현, Cmd+C/V/Z 키보드 단축키 지원, undo history 최대 10개

**Details:**

1. `CopyRepeatActions` 컴포넌트 생성 (시간 그리드 상단 우측)
2. '전 주와 동일' 버튼:
   - 현재 주차의 선택된 일자에 직전 주차 mask 복제
   - `copyFromPreviousWeek(weekStart, blocks, availableDates)` 유틸 함수
3. '모든 주차에 적용' 버튼:
   - 확인 다이얼로그 표시 (덮어쓰기 경고)
   - 현재 주차 패턴을 모든 주에 브로드캐스트
   - `applyToAllWeeks(weekStart, blocks, allDays)` 유틸 함수
4. '요일 복사 → 다른 요일' 기능:
   - 일자 라벨에 ⋯ 메뉴 추가
   - 클립보드 상태: `useState<SlotMask | null>(copiedMask)`
   - 메뉴 항목: '이 요일 복사' / '붙여넣기'
5. Undo history 구현:
   - `useState<Record<string, SlotMask>[]>` 최대 10개
   - blocks 변경 시 이전 상태 push
   - `useHistoryStack(blocks, maxSize: 10)` 커스텀 훅
6. 키보드 단축키:
   - `Cmd/Ctrl+C`: 현재 주차 mask 복사
   - `Cmd/Ctrl+V`: 붙여넣기
   - `Cmd/Ctrl+Z`: undo
   - useEffect로 keydown 리스너 등록

### 9.5. 9-D 24h/9-22 토글 + Working Hours 시각화

**Status:** pending  
**Dependencies:** 9.1, 9.2  

헤더에 24h/9-22 토글 추가, 24h 모드 가로 스크롤, 9-22 모드 working-hours 외부 stripe 강조

**Details:**

1. `useState<'9-22' | '24h'>` 상태 추가
2. 토글 버튼 UI (헤더 우측):
   ```tsx
   <button onClick={() => setTimeMode(m => m === '9-22' ? '24h' : '9-22')}>
     {timeMode === '9-22' ? '24h로 보기' : '9-22로 보기'}
   </button>
   ```
3. 9-22 모드 (슬롯 18~43, 26개):
   - 현재 구현 유지
   - working-hours 외부 셀에 stripe 패턴 + opacity-50 적용
   - 외부 셀 클릭 시 토스트: '근무 시간 외입니다'
4. 24h 모드 (슬롯 0~47, 48개):
   - 가로 스크롤 활성화
   - `scrollLeft` 위치 저장 (토글 시 복원)
   - 시간 레이블 전체 표시 (00:00~23:30)
5. stripe 패턴 CSS:
   ```css
   .stripe-pattern {
     background: repeating-linear-gradient(
       45deg,
       transparent,
       transparent 2px,
       rgba(128,128,128,0.1) 2px,
       rgba(128,128,128,0.1) 4px
     );
   }
   ```
6. 시간축 sticky 헤더 구현

### 9.6. 9-E 실시간 요약 푸터

**Status:** pending  
**Dependencies:** 9.1, 9.2  

모달 푸터 위에 '선택: 12시간 / 5일 / 멤버 평균 14시간' 형태의 실시간 요약 표시

**Details:**

1. `ScheduleSummary` 컴포넌트 생성
2. 계산 로직 (useMemo):
   ```tsx
   const summary = useMemo(() => {
     const totalSlots = Object.values(blocks).reduce(
       (acc, mask) => acc + mask.filter(Boolean).length, 0
     );
     const totalHours = Math.round((totalSlots * 30) / 60);
     const totalDays = availableDates.length;
     const avgHoursPerDay = totalDays > 0 
       ? (totalHours / totalDays).toFixed(1) 
       : 0;
     return { totalHours, totalDays, avgHoursPerDay };
   }, [blocks, availableDates]);
   ```
3. UI 레이아웃:
   ```tsx
   <div className="border-t border-border px-s-4 py-s-2 text-caption">
     선택: <strong>{summary.totalHours}</strong>시간 / 
     <strong>{summary.totalDays}</strong>일 / 
     일평균 <strong>{summary.avgHoursPerDay}</strong>시간
   </div>
   ```
4. 위치: ResponsiveSheetBody 하단, ResponsiveSheetFooter 상단
5. Step 2(시간 블록) 단계에서만 표시

### 9.7. 9-F Smart Defaults — 첫 진입 프리셋 추천

**Status:** pending  
**Dependencies:** 9.1, 9.2, 9.3  

첫 진입 시 '평일 저녁 + 주말 종일' 프리셋 자동 적용, '비우고 시작' 버튼, 무시 시 다음부터 비활성

**Details:**

1. localStorage 플래그: `bandage-smart-default-dismissed`
2. 첫 진입 감지:
   - 모달 open 시 blocks가 비어있고 dismissed 플래그가 false면 적용
3. Smart Default 패턴:
   - 평일: 저녁 19-22 (슬롯 38-43)
   - 주말: 종일 09-22 (슬롯 18-43)
4. `applySmartDefault(allDays, setBlocks)` 유틸 함수:
   ```tsx
   const applySmartDefault = (allDays: string[]) => {
     const newBlocks: Record<string, SlotMask> = {};
     for (const day of allDays) {
       const mask = Array.from({ length: 48 }, () => false);
       if (isWeekend(day)) {
         // 주말: 09-22 전체
         for (let i = 18; i < 44; i++) mask[i] = true;
       } else {
         // 평일: 19-22
         for (let i = 38; i < 44; i++) mask[i] = true;
       }
       newBlocks[day] = mask;
     }
     return newBlocks;
   };
   ```
5. '비우고 시작' 버튼:
   - 클릭 시 blocks 초기화 + dismissed 플래그 true로 설정
   - 위치: Step 1(가능 일자) 상단 또는 Smart Default 배너 내
6. 배너 UI:
   ```tsx
   {showSmartDefault && (
     <div className="bg-accent-dim rounded-lg px-s-4 py-s-3 mb-s-3">
       <p>평일 저녁 + 주말 종일이 자동 적용되었습니다.</p>
       <button onClick={clearAndDismiss}>비우고 시작</button>
     </div>
   )}
   ```
