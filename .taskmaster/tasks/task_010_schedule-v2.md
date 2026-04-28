# Task ID: 10

**Title:** 메인 헤더 진행도 게이지

**Status:** pending

**Dependencies:** 1, 8

**Priority:** medium

**Description:** SchedulingMain 상단 헤더에 진행도 게이지 추가. 입력 진행 중=파랑, 시간표 확정 후=초록. 텍스트: 'N/M 명 일정 입력 완료' 또는 '시간표 확정'.

**Details:**

1. SchedulingDetailHeader.client.tsx 생성
   - 회의 제목 / 매니저 / 합주 기간 표시
   - 진행도 게이지 바
   - '나의 스케줄 입력' 버튼
   - 매니저: '합주 시간표 확정' 버튼
2. 게이지 계산:
   - 분모: 확정 곡 참여 멤버 합집합 수
   - 분자: schedule.completed=true 멤버 수
3. 색상 분기:
   - confirmedBoardId 없음: bg-accent (파랑)
   - confirmedBoardId 있음: bg-success (초록)
4. 텍스트:
   - 확정 전: '5/7 명 일정 입력 완료'
   - 확정 후: '시간표 확정 - 5/7 참여'

```tsx
<div className="flex items-center gap-s-2">
  <div className="h-2 flex-1 rounded-full bg-card overflow-hidden">
    <div 
      className={cn(
        'h-full transition-all',
        isConfirmed ? 'bg-success' : 'bg-accent'
      )}
      style={{ width: `${pct}%` }}
    />
  </div>
  <span className="text-micro text-foreground-muted">
    {isConfirmed ? `시간표 확정 - ${completed}/${total} 참여` : `${completed}/${total} 명 일정 입력 완료`}
  </span>
</div>
```

**Test Strategy:**

1. 게이지 퍼센트 정확도
2. 확정 전 파랑, 확정 후 초록
3. 텍스트 내용 분기
4. 버튼 클릭 동작
5. 실시간 진행도 갱신

## Subtasks

### 10.1. 진행도 계산 유틸 함수 및 타입 정의

**Status:** pending  
**Dependencies:** None  

SchedulingMain 헤더에 표시할 진행도 게이지를 계산하기 위한 유틸 함수와 관련 타입을 정의합니다. 확정 곡 참여 멤버 합집합(분모)과 schedule.completed=true 멤버 수(분자)를 계산합니다.

**Details:**

1. domain/schedule-coordination/types.ts에 ProgressInfo 타입 추가:
```ts
export interface ProgressInfo {
  completed: number;   // schedule.completed=true 멤버 수
  total: number;       // 확정 곡 참여 멤버 합집합 수
  isConfirmed: boolean; // meeting.confirmedSlot 존재 여부
}
```

2. domain/schedule-coordination/utils.ts에 calculateScheduleProgress 함수 추가:
- 입력: songs(확정 곡 목록), schedules(멤버 스케줄 맵), meeting(confirmedSlot 확인용)
- 로직: isReady(song)인 곡들의 confirmed 멤버 합집합을 구하고, 해당 멤버들 중 schedule.completed=true인 수를 집계
- 반환: ProgressInfo 객체

3. 기존 SchedulingMain.client.tsx에서 이미 사용 중인 participantIds, memberSchedules, isReady 패턴을 참고하여 일관성 있게 구현

### 10.2. ProgressGauge UI 컴포넌트 생성

**Status:** pending  
**Dependencies:** 10.1  

진행도를 시각적으로 표시하는 재사용 가능한 ProgressGauge 컴포넌트를 생성합니다. 확정 전=파랑(bg-accent), 확정 후=초록(bg-success) 색상으로 분기합니다.

**Details:**

1. components/ui/progress-gauge.tsx 생성:
```tsx
interface ProgressGaugeProps {
  completed: number;
  total: number;
  isConfirmed: boolean;
  className?: string;
}
```

2. 게이지 바 구조 (기존 PasswordStrength 패턴 참고):
- 외부: h-2 rounded-full bg-card overflow-hidden
- 내부: h-full transition-all + 동적 width
- 색상: isConfirmed ? 'bg-success' : 'bg-accent'

3. 접근성 속성 추가:
- role="progressbar"
- aria-valuemin={0}, aria-valuemax={total}, aria-valuenow={completed}
- aria-label="일정 입력 진행도"

4. 퍼센트 계산: total > 0 ? (completed / total) * 100 : 0

### 10.3. 진행도 텍스트 레이블 컴포넌트 생성

**Status:** pending  
**Dependencies:** 10.1  

진행도 상태에 따라 적절한 텍스트를 표시하는 컴포넌트를 생성합니다. 확정 전='N/M 명 일정 입력 완료', 확정 후='시간표 확정 - N/M 참여' 형식입니다.

**Details:**

1. ProgressGauge 컴포넌트 내부 또는 별도 ProgressLabel로 텍스트 표시:
```tsx
<span className="text-micro text-foreground-muted">
  {isConfirmed 
    ? `시간표 확정 - ${completed}/${total} 참여` 
    : `${completed}/${total} 명 일정 입력 완료`}
</span>
```

2. 텍스트 스타일:
- text-micro 사이즈 (기존 상태 뱃지와 일관성)
- text-foreground-muted 색상
- shrink-0으로 축소 방지

3. ProgressGauge 컴포넌트에 showLabel prop 추가하거나, 게이지와 텍스트를 함께 렌더링하는 복합 컴포넌트로 구성

### 10.4. SchedulingMain 헤더에 진행도 게이지 통합

**Status:** pending  
**Dependencies:** 10.1, 10.2, 10.3  

기존 SchedulingMain.client.tsx 헤더 영역에 진행도 게이지와 텍스트를 통합합니다. 회의 제목/매니저/합주 기간 아래, 버튼 위에 배치합니다.

**Details:**

1. SchedulingMain.client.tsx에 calculateScheduleProgress 임포트 및 호출:
```tsx
const progressInfo = useMemo(() => 
  calculateScheduleProgress(allSongs, schedulesAll, meeting),
  [allSongs, schedulesAll, meeting]
);
```

2. 헤더 영역(line 105-141)에 진행도 게이지 삽입:
- 위치: mt-s-2의 메타 정보 div와 mt-s-3의 버튼 div 사이
- 레이아웃: flex items-center gap-s-2

3. 기존 confirmedSlot 뱃지와 중복 제거 또는 조정:
- 진행도 게이지가 확정 상태를 이미 표시하므로 기존 뱃지 제거 검토
- 또는 뱃지는 확정 일시를 표시하고, 게이지는 참여도를 표시하는 역할 분리

4. 구현 코드:
```tsx
<div className="mt-s-2 flex items-center gap-s-2">
  <div className="h-2 flex-1 rounded-full bg-card overflow-hidden">
    <div 
      className={cn(
        'h-full transition-all',
        progressInfo.isConfirmed ? 'bg-success' : 'bg-accent'
      )}
      style={{ width: `${progressInfo.total > 0 ? (progressInfo.completed / progressInfo.total) * 100 : 0}%` }}
    />
  </div>
  <span className="text-micro text-foreground-muted shrink-0">
    {progressInfo.isConfirmed 
      ? `시간표 확정 - ${progressInfo.completed}/${progressInfo.total} 참여` 
      : `${progressInfo.completed}/${progressInfo.total} 명 일정 입력 완료`}
  </span>
</div>
```
