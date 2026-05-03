# Task ID: 7

**Title:** 24h 토글 + 가로 스크롤 적용

**Status:** pending

**Dependencies:** 5

**Priority:** medium

**Description:** 시간표 에디터에 9-22 기본 / 24h 확장 토글 추가. 24h 선택 시 가로 스크롤 또는 셀 압축. 나의 스케줄 입력 모달에도 동일 적용.

**Details:**

1. ScheduleBoardEditor에 24h 토글 버튼 추가
   - 기본: 09:00~22:00 (슬롯 18~43, 26슬롯)
   - 24h: 00:00~24:00 (슬롯 0~47, 48슬롯)
2. 24h 모드 시 UI 처리:
   - 가로 스크롤 (overflow-x-auto) + 최소 셀 너비 유지
   - 또는 셀 압축 (min-w 축소)
3. ScheduleInputModal Step2에도 동일 토글 적용
4. 공용 훅/상태로 분리: useTimeRangeMode()

```tsx
type TimeRange = '9-22' | '24h';
const [timeRange, setTimeRange] = useState<TimeRange>('9-22');

const visibleSlots = timeRange === '24h' 
  ? Array.from({ length: 48 }, (_, i) => i)
  : Array.from({ length: 26 }, (_, i) => 18 + i);
```

5. 셀 너비 조정:
   - 9-22: w-10 (40px)
   - 24h: w-6 (24px) + 가로 스크롤

**Test Strategy:**

1. 토글 버튼 클릭 시 시간 범위 전환
2. 24h 모드에서 00:00~24:00 전체 표시
3. 가로 스크롤 동작 확인
4. 9-22 복귀 시 기존 범위로 돌아감
5. 스케줄 입력 모달에서도 동일 동작

## Subtasks

### 7.1. useTimeRangeMode 공용 훅 생성

**Status:** pending  
**Dependencies:** None  

시간 범위 모드(9-22/24h)를 관리하는 공용 훅을 domain/schedule-coordination/hooks 경로에 생성합니다.

**Details:**

domain/schedule-coordination/hooks/useTimeRangeMode.ts 파일 생성. TimeRange 타입('9-22' | '24h') 정의, useState로 기본값 '9-22' 관리, visibleSlots 계산 로직 포함(9-22: 슬롯 18~43(26개), 24h: 슬롯 0~47(48개)). getCellWidth 헬퍼 함수 추가(9-22: 'w-10', 24h: 'w-6'). 반환값: { timeRange, setTimeRange, visibleSlots, cellWidthClass, is24hMode }

### 7.2. TimeRangeToggle UI 컴포넌트 구현

**Status:** pending  
**Dependencies:** 7.1  

9-22/24h 모드를 전환하는 토글 버튼 UI 컴포넌트를 생성합니다.

**Details:**

domain/schedule-coordination/components/TimeRangeToggle.client.tsx 생성. props: { value: TimeRange, onChange: (v: TimeRange) => void }. 현재 SchedulingMain에 있는 UnderlineTabs 패턴 활용하여 '9-22' / '24h' 두 버튼 토글 UI 구현. 선택된 모드는 bg-accent 강조, 비선택은 bg-card. 컴포넌트는 컴팩트하게 gap-s-1로 배치.

### 7.3. Step2Blocks에 24h 토글 및 가로 스크롤 적용

**Status:** pending  
**Dependencies:** 7.1, 7.2  

ScheduleInputModal의 Step2Blocks 컴포넌트에 useTimeRangeMode 훅과 TimeRangeToggle을 통합하고 24h 모드 시 가로 스크롤 UI를 적용합니다.

**Details:**

ScheduleInputModal.client.tsx의 Step2Blocks 수정. useTimeRangeMode 훅 import 및 사용. TimeRangeToggle 컴포넌트를 주차 네비게이션 옆에 배치. 현재 하드코딩된 슬롯 배열(18~43)을 visibleSlots로 교체. table 컨테이너에 24h 모드일 때 overflow-x-auto + min-w-[1200px] 적용. 셀 너비를 cellWidthClass로 동적 적용(9-22: h-6 w-10, 24h: h-6 w-6). 헤더 시간 레이블도 visibleSlots 기반으로 동적 생성(매 4슬롯마다 표시).

### 7.4. SongMatrixPanel에 24h 토글 적용

**Status:** pending  
**Dependencies:** 7.1, 7.2  

SchedulingMain의 SongMatrixPanel 컴포넌트에 동일한 24h 토글 기능을 적용합니다.

**Details:**

SchedulingMain.client.tsx의 SongMatrixPanel 수정. useTimeRangeMode 훅 import 및 사용. TimeRangeToggle을 패널 상단 설명 문구 옆에 배치. 현재 하드코딩된 슬롯 배열([18,22,26,30,34,38,42])을 visibleSlots 기반으로 교체(9-22: 매 4슬롯, 24h: 매 4슬롯 또는 매 6슬롯 표시). 24h 모드 시 overflow-x-auto 적용. 셀 너비 동적 조정. 헤더/바디 슬롯 레이블을 slotToTime 헬퍼로 동적 생성.
