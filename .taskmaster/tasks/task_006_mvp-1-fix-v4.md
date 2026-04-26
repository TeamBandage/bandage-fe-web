# Task ID: 6

**Title:** DateTimePicker UX 보강 (연/월 빠른 선택 + 시간 듀얼 모드)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** 캘린더 헤더에서 연/월을 빠르게 선택할 수 있는 드롭다운을 추가하고, 시간 선택 휠 위에 직접 입력 가능한 텍스트 박스를 제공한다.

**Details:**

## 구현 대상

### 6-1: 연/월 빠른 선택
1. **YearMonthPicker** (`src/components/ui/year-month-picker.tsx`)
   - Props: `year: number`, `month: number`, `minYear: number`, `maxYear: number`, `onChange: (y, m) => void`
   - 렌더링: 팝오버 내 연도 그리드 (현재±5년 = 12칸) + 월 그리드 (1~12, 4×3)
   - 키보드: Arrow 키 이동, Enter 확정, Esc 닫기

2. **Calendar 컴포넌트 수정** (`src/components/ui/date-time-picker.tsx`)
   - 헤더의 "2026년 4월" 텍스트를 버튼으로 변경
   - 클릭 시 YearMonthPicker 팝오버 오픈
   - 선택 완료 → `setView({ y, mo })` 호출

### 6-2: 시간 입력 듀얼 모드 (PRD default: (a))
1. **Wheel 컴포넌트 위에 input 추가**
   - 시/분 각각 `<input type="number" />` 추가
   - 휠 스크롤과 input 값 양방향 동기화
   - input focus 시 전체 선택 (UX 편의)
   - 범위 validation: 시 0~23, 분 0~59 (step 단위로 반올림)

2. **휠 감도 보정**
   - `scroll-snap-type: y mandatory` 이미 적용됨
   - snap target 높이 증가: ITEM_H 32 → 40
   - `-webkit-overflow-scrolling: touch` 추가

### 6-3: 시작/소요 시간 시각 강조
- 마법사 메타 단계 UI 수정 (PracticeCreateWizard Step 2)
- 시작 시각 + 소요 시간을 2컬럼 그리드 카드로 배치
- 텍스트: success/accent 톤, font-bold, text-subtitle 사이즈
- 제목/장소 input은 기존 크기 유지

## 의사 코드
```tsx
// YearMonthPicker
export function YearMonthPicker({ year, month, onChange, onClose }) {
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selY, setSelY] = useState(year);
  const [selM, setSelM] = useState(month);
  
  return (
    <div className="p-s-3">
      <div className="grid grid-cols-4 gap-1 mb-s-2">
        {years.map(y => <button onClick={() => setSelY(y)} className={selY === y ? 'bg-accent' : ''}>{y}</button>)}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {months.map(m => <button onClick={() => { onChange(selY, m); onClose(); }}>{m}월</button>)}
      </div>
    </div>
  );
}

// Wheel with input
function Wheel({ label, values, value, onChange }) {
  return (
    <div>
      <input type="number" value={value} onChange={e => onChange(clamp(Number(e.target.value), min, max))} />
      {/* 기존 휠 렌더링 */}
    </div>
  );
}
```

**Test Strategy:**

1. 캘린더 헤더 "2026년 4월" 클릭 → YearMonthPicker 팝오버 표시
2. 2024년 선택 → 6월 클릭 → 캘린더가 2024-06으로 이동
3. 키보드 Arrow 키로 연/월 이동, Enter 확정, Esc 닫기
4. 시간 input에 직접 "14" 입력 → 휠이 14시 위치로 스크롤
5. 휠 스크롤 → input 값 동기화
6. input에 25 입력 시 23으로 자동 보정
7. 마법사 메타 단계에서 시작 시각/소요 시간 카드 스타일 확인 (볼드, accent 톤)

## Subtasks

### 6.1. YearMonthPicker 컴포넌트 신규 생성

**Status:** pending  
**Dependencies:** None  

캘린더 헤더에서 연/월을 빠르게 선택할 수 있는 YearMonthPicker 컴포넌트를 src/components/ui/year-month-picker.tsx에 구현한다.

**Details:**

Props로 year, month, minYear, maxYear, onChange, onClose를 받는 컴포넌트 생성. 연도 그리드는 현재 연도 기준 ±5년(총 11개) 배치, 월 그리드는 1~12월을 4×3으로 배치. 연도 선택 시 내부 state만 업데이트하고, 월 클릭 시 onChange(selectedYear, selectedMonth) 호출 후 onClose() 실행. 키보드 접근성: Arrow 키로 포커스 이동, Enter로 확정, Escape로 닫기. 스타일은 기존 Dialog/Chip 패턴(bg-card, border-border, bg-accent 선택 상태)을 따르며, 팝오버 형태로 position: absolute 또는 Radix Popover 사용.

### 6.2. Calendar 컴포넌트에 YearMonthPicker 팝오버 통합

**Status:** pending  
**Dependencies:** 6.1  

date-time-picker.tsx의 Calendar 헤더 '2026년 4월' 텍스트를 버튼으로 변경하고, 클릭 시 YearMonthPicker 팝오버를 표시한다.

**Details:**

Calendar 컴포넌트(line 277~363)의 헤더 영역에서 '{viewYear}년 {viewMonth}월' div를 button으로 변경. 클릭 시 로컬 state(showYearMonthPicker)를 true로 설정하여 YearMonthPicker 팝오버 오픈. 팝오버는 헤더 버튼 아래에 절대 위치로 표시. YearMonthPicker의 onChange 콜백에서 onNav 대신 직접 setView({ y, mo })를 호출하도록 부모(DateTimePicker)로부터 새 prop(onViewChange) 전달. aria-expanded, aria-haspopup 속성 추가. 팝오버 외부 클릭 시 닫기 처리.

### 6.3. Wheel 컴포넌트에 직접 입력 input 추가 (듀얼 모드)

**Status:** pending  
**Dependencies:** None  

시간 선택 Wheel 컴포넌트 상단에 직접 입력 가능한 number input을 추가하여 휠 스크롤과 양방향 동기화한다.

**Details:**

Wheel 컴포넌트(line 366~466)에 <input type='number'> 추가. input value는 현재 선택값(pad 적용), onChange 시 clamp(Number(value), min, max) 후 부모 onChange 호출. 시(0~23), 분(step 단위 반올림) 범위 validation 적용. input focus 시 전체 선택(select()) UX 구현. input과 휠 스크롤 양방향 동기화: input 변경 시 ref.current.scrollTop 업데이트, 휠 스크롤 시 input 값 자동 반영. ITEM_H를 32에서 40으로 증가하여 터치 감도 개선. 스타일: input은 휠 영역 상단 중앙, bg-transparent border-b text-center 형태.

### 6.4. PracticeCreateWizard Step 3 메타 단계 시작/소요 시간 시각 강조

**Status:** pending  
**Dependencies:** None  

합주 생성 마법사 Step 3(일정 설정)에서 시작 시각과 소요 시간을 2컬럼 그리드 카드로 배치하고 시각적으로 강조한다.

**Details:**

PracticeCreateWizard.client.tsx의 step === 2 섹션(line 281~318) 수정. 시작 시각 DateTimePicker와 소요 시간 Input을 기존 세로 나열에서 'grid grid-cols-1 sm:grid-cols-2 gap-s-3' 2컬럼 카드 레이아웃으로 변경. 각 카드는 bg-card border-border rounded-md p-s-4 스타일 적용. 라벨 텍스트는 text-success 또는 text-accent 톤, font-bold, text-subtitle 사이즈로 강조. 제목/장소 input은 기존 크기 유지(변경 없음). 카드 내부에 아이콘(Clock, Timer) 추가하여 시각적 구분.
