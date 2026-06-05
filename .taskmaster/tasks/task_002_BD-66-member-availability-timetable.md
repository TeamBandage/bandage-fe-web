# Task ID: 2

**Title:** 마이페이지 주간 타임테이블 UI 수정

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** WeeklyTimetable 상단 여백 60px, 시간 레이블 그리드 라인 정렬, PC 세로 스크롤, ScheduleManagerModal 스크롤 처리

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 2.1. WeeklyTimetable 상단 여백 60px 확인

**Status:** done  
**Dependencies:** None  

WeeklyTimetable 컴포넌트의 section 요소에 mt-15(60px) 상단 여백이 적용되어 있는지 확인한다

**Details:**

WeeklyTimetable.client.tsx 156번 줄에서 section 요소에 className='mt-15'가 이미 적용되어 있음. Tailwind CSS v4 기준 mt-15는 60px(15 * 4px)에 해당. 현재 구현이 요구사항과 일치하므로 추가 작업 불필요.

### 2.2. 시간 레이블 그리드 라인 수직 중앙 정렬 확인

**Status:** done  
**Dependencies:** None  

시간 레이블(9:00, 10:00 등)이 그리드 라인과 수직 중앙 정렬되도록 translateY(-50%) 적용 여부 확인

**Details:**

WeeklyTimetable.client.tsx 196-199번 줄에서 시간 레이블 span 요소에 style={{ top: slotIdx * CELL_HEIGHT, transform: 'translateY(-50%)' }}가 이미 적용되어 있음. 이로 인해 레이블이 해당 시간대 그리드 라인과 수직 중앙에 정렬됨.

### 2.3. PC 데스크톱 세로 스크롤 활성화 확인

**Status:** done  
**Dependencies:** None  

(main)/layout.tsx의 Desktop main 요소에 overflow-y-auto 적용으로 세로 스크롤 활성화 여부 확인

**Details:**

layout.tsx 34번 줄에서 Desktop 레이아웃의 main 요소에 className='flex flex-1 flex-col overflow-y-auto'가 이미 적용되어 있음. Shell 내부에서 main 영역이 Sidebar와 함께 배치되며, 콘텐츠가 넘칠 경우 세로 스크롤이 정상 동작함.

### 2.4. ScheduleManagerModal 스크롤 처리 확인

**Status:** done  
**Dependencies:** None  

ScheduleManagerModal 카드 div에 max-h-[90vh] overflow-y-auto 적용으로 모달 내부 스크롤 처리 여부 확인

**Details:**

ScheduleManagerModal.client.tsx 184번 줄에서 모달 카드 div에 className='overflow-y-auto'와 style={{ maxHeight: '90vh' }}가 이미 적용되어 있음. 모달 콘텐츠가 뷰포트 90%를 초과할 경우 내부 스크롤이 활성화됨.
