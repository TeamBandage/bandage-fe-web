# Task ID: 6

**Title:** Phase F: DateTimePicker 캘린더+시간휠 모달 전환

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 기존 native date input + select 방식을 design/figma-export/screens/09-datetime-picker.png 디자인의 캘린더(좌)+시간휠(우) Dialog 모달로 교체, ResponsiveSheet 활용(lg=Dialog, mobile=BottomSheet)

**Details:**

1. src/components/ui/date-time-picker.tsx 전면 재구현:
   - 트리거: read-only Input (클릭 시 모달 오픈)
   - ResponsiveSheet 사용 (기존 패턴 활용)

2. 모달 레이아웃 (09-datetime-picker.png 기준):
   ```
   ┌─────────────────────────────────────────────┐
   │ [오늘] [내일] [다음 주]  ← 빠른 선택 칩      │
   ├─────────────────────┬───────────────────────┤
   │   < 2026년 4월 >    │     시간 선택          │
   │  일 월 화 수 목 금 토│    시    :   분       │
   │  ...날짜 그리드...  │   [00]      [00]      │
   │                     │   [01]      [05]      │
   │                     │   [02]      [10]      │
   ├─────────────────────┴───────────────────────┤
   │ 2026.04.25 (토) 19:00      [취소] [확인]    │
   └─────────────────────────────────────────────┘
   ```

3. 구현 세부:
   - 캘린더: date-fns의 startOfMonth, endOfMonth, eachDayOfInterval 활용
   - 시간 휠: 시(00~23) + 분(0, 5, 10...55) 스크롤 리스트
   - 빠른 선택: 오늘, 내일, 다음 주 (addDays, addWeeks 활용)
   - 키보드: 캘린더 화살표 이동, Esc 닫기, Enter 확정

4. 기존 API 유지:
   - value: 'yyyy-MM-dd HH:mm' 문자열
   - onChange: (next: string) => void
   - step, required, disabled 등

5. 사용처 확인:
   - PracticeCreateModal, PerformanceCreateModal
   - PracticeDetailContent, PerformanceDetailContent 일정 변경

**Test Strategy:**

1. lg breakpoint: Dialog 형태로 표시 확인
2. 모바일: BottomSheet 형태로 표시 확인
3. 날짜 선택 → 선택 텍스트 업데이트 확인
4. 시/분 휠 스크롤 동작 확인
5. '오늘/내일/다음 주' 빠른 선택 동작 확인
6. 키보드 접근성: 화살표, Tab, Esc, Enter
7. Asia/Seoul 타임존 고정 확인
8. pnpm typecheck && pnpm test 통과

## Subtasks

### 6.1. 캘린더 컴포넌트 구현 (DateTimePickerCalendar)

**Status:** pending  
**Dependencies:** None  

date-fns 기반으로 월별 캘린더 그리드를 렌더링하는 내부 컴포넌트를 구현합니다. 디자인(09-datetime-picker.png)의 좌측 캘린더 영역에 해당합니다.

**Details:**

1. src/components/ui/date-time-picker.tsx 파일에 DateTimePickerCalendar 내부 컴포넌트를 추가합니다.

2. 캘린더 그리드 구현:
   - date-fns의 startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths 활용
   - 7x6 그리드 (일~토 요일 헤더 + 최대 6주)
   - 일요일은 text-danger, 토요일은 text-accent 색상 적용
   - 현재 월 외 날짜는 흐리게 표시 (opacity-40)

3. 날짜 셀 스타일링:
   - 오늘 날짜: bg-accent-soft 배경 + 하단 dot indicator
   - 선택된 날짜: bg-accent 배경 + 흰색 텍스트
   - hover: bg-card-hover
   - 과거 날짜(선택적 minDate prop): disabled 처리

4. 월 네비게이션 헤더:
   - "< 2026년 4월 >" 형식 표시
   - 좌우 화살표 버튼으로 addMonths/subMonths 호출
   - aria-label="이전 달", aria-label="다음 달" 접근성 레이블

5. Props 인터페이스:
   - viewYear, viewMonth: 현재 보고 있는 연월
   - selectedDate: { year, month, day } 선택된 날짜
   - onSelectDate: (date: {year, month, day}) => void
   - onNavigate: (direction: -1 | 1) => void
   - minDate?: Date (과거 날짜 비활성화용)

6. 키보드 접근성:
   - 화살표 키로 날짜 셀 간 이동
   - Enter로 날짜 선택
   - Tab으로 월 네비게이션 버튼과 그리드 간 이동

### 6.2. 시간 휠 컴포넌트 구현 (DateTimePickerWheel)

**Status:** pending  
**Dependencies:** None  

iOS 스타일의 스크롤 휠로 시(00~23)와 분(5분 단위)을 선택하는 내부 컴포넌트를 구현합니다. 디자인의 우측 시간 선택 영역에 해당합니다.

**Details:**

1. src/components/ui/date-time-picker.tsx 파일에 DateTimePickerWheel 내부 컴포넌트를 추가합니다.

2. 휠 UI 구조:
   - 세로 스크롤 리스트 (overflow-y: auto, scroll-snap-type: y mandatory)
   - 각 아이템 높이 32px, 총 5개 보이도록 (높이 160px)
   - 중앙 하이라이트 밴드: bg-accent-dim + 상하 1px border-accent
   - 상하 패딩으로 첫/마지막 아이템도 중앙 위치 가능하게

3. 시간 휠 (시):
   - values: [0, 1, 2, ..., 23]
   - 표시 형식: dtpPad(value) -> "00", "01", ..., "23"
   - label: "시"

4. 분 휠:
   - values: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] (step prop 기반 생성)
   - 표시 형식: dtpPad(value) -> "00", "05", ..., "55"
   - label: "분"

5. 스크롤 동작:
   - onScroll 이벤트로 현재 중앙 아이템 계산 (scrollTop / ITEM_HEIGHT)
   - 스냅 후 해당 값으로 onChange 호출
   - useEffect로 value 변경 시 해당 위치로 scrollTop 설정

6. Props 인터페이스:
   - label: string ("시" 또는 "분")
   - values: number[]
   - value: number
   - onChange: (value: number) => void

7. 스타일링:
   - 선택된 값: text-accent + font-semibold
   - 비선택 값: text-foreground-sub
   - 스크롤바 숨김: scrollbar-width: none
   - 둥근 모서리: rounded-lg
   - 배경: bg-card, border: border-border

### 6.3. DateTimePicker 모달 통합 및 빠른 선택 칩 구현

**Status:** pending  
**Dependencies:** 6.1, 6.2  

ResponsiveSheet를 활용하여 캘린더+시간휠을 포함한 모달을 구성하고, 오늘/내일/다음 주 빠른 선택 칩을 추가합니다.

**Details:**

1. DateTimePicker 컴포넌트 전면 재구현:
   - 기존 native date input + select 구조를 제거
   - ResponsiveSheet 기반 모달로 전환 (lg: Dialog, mobile: BottomSheet)

2. 트리거 UI:
   - read-only Input 클릭 시 모달 오픈
   - 값이 있을 때: "2026.04.25 (토) 19:00" 형식 표시 (dtpFormatDisplay 함수)
   - 값이 없을 때: placeholder 텍스트 (기본값 "날짜와 시간을 선택하세요")
   - 우측에 CalendarIcon 표시

3. 모달 레이아웃 구조:
   ```
   ResponsiveSheetContent
     ├─ QuickChips: 오늘 | 내일 | 다음 주 (Chip 컴포넌트 활용)
     ├─ Body: flex (lg: row, mobile: column)
     │   ├─ DateTimePickerCalendar (flex-1)
     │   └─ TimeWheelSection (시:분 휠, 구분자 ":", w-60)
     └─ Footer: 선택된 값 표시 + 취소/확인 버튼
   ```

4. 빠른 선택 칩 구현:
   - date-fns addDays, addWeeks 활용
   - 오늘: addDays(today, 0)
   - 내일: addDays(today, 1)
   - 다음 주: addWeeks(today, 1)
   - 클릭 시 해당 날짜로 draft 상태 업데이트 + viewMonth 이동
   - 현재 draft와 일치하면 selected 스타일 적용

5. 상태 관리:
   - draft: { year, month, day, hour, minute } 임시 선택 상태
   - viewYear, viewMonth: 캘린더 뷰 상태
   - open: 모달 열림 상태
   - useEffect로 open 시 value를 draft로 초기화

6. Footer UI:
   - 좌측: 선택된 값 표시 (dtpFormatDisplay(draft))
   - 우측: 취소(ResponsiveSheetClose) + 확인 버튼
   - 확인 클릭 시 onChange(dtpFormat(draft)) 호출 후 모달 닫기

7. 반응형 레이아웃:
   - lg 이상: 캘린더와 시간휠 가로 배치 (flex-row), 모달 너비 ~620px
   - 모바일: 캘린더와 시간휠 세로 배치 (flex-col), BottomSheet 전체 너비

### 6.4. API 호환성 유지 및 사용처 통합 테스트

**Status:** pending  
**Dependencies:** 6.3  

기존 DateTimePicker API(value, onChange, step, disabled 등)를 유지하면서 PracticeCreateModal, PerformanceCreateModal 등 기존 사용처에서 정상 동작하는지 확인합니다.

**Details:**

1. 기존 API 인터페이스 유지 확인:
   - value: 'yyyy-MM-dd HH:mm' 문자열 형식
   - onChange: (next: string) => void
   - step?: number (분 단위 granularity, 기본 5)
   - required?: boolean
   - disabled?: boolean
   - id?, name?, className?, aria-label? 등

2. 기존 유틸 함수 유지:
   - toKstString: datetime-local ↔ 'yyyy-MM-dd HH:mm' 변환
   - 내부 split, join 함수 리팩터링 또는 제거

3. 사용처 확인 및 테스트:
   - src/domain/practice/components/PracticeCreateModal.client.tsx
     - Controller로 DateTimePicker 사용
     - startAt 필드 바인딩 확인
   - src/domain/performance/components/PerformanceCreateModal.client.tsx
     - 동일하게 Controller로 startAt 바인딩
   - src/app/(main)/practices/new/PracticeCreateForm.client.tsx
   - src/app/(main)/performances/new/PerformanceCreateForm.client.tsx

4. 접근성 보완:
   - 모달 열릴 때 포커스 트랩
   - Esc 키로 모달 닫기 (ResponsiveSheet 기본 동작)
   - Enter로 확인 (submit 버튼 autoFocus)
   - 캘린더 그리드 role="grid", aria-label="날짜 선택"
   - 시간 휠 aria-label="시 선택", aria-label="분 선택"

5. 타임존 처리:
   - lib/date.ts의 KST_FORMAT('yyyy-MM-dd HH:mm') 활용
   - formatKst, parseKst 필요 시 통합
   - 모든 날짜 표시는 Asia/Seoul 기준

6. hidden input name 바인딩:
   - 기존처럼 name prop이 있으면 hidden input으로 form 제출 지원

7. pnpm typecheck && pnpm lint 통과 확인
