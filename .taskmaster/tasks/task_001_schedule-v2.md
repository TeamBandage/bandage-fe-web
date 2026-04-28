# Task ID: 1

**Title:** 마스터-디테일 구조 및 라우트 재설계

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** /setlist-meetings/scheduling 경로에 마스터-디테일 구조 도입. 좌측 회의 목록 패널(SetlistMeetingsListPane 재사용) + 우측 상세 영역 분리. 회의 카드에 일정 조율 진행도 게이지 추가.

**Details:**

1. SchedulingListPane.client.tsx 생성 - SetlistMeetingsListPane 패턴 재사용
   - 회의 카드에 진행도 막대 추가: 분모=확정 곡 참여 멤버 합집합, 분자=schedule.completed=true 멤버 수
   - 시간표 확정 시 bg-success, 그 전 bg-accent
2. SchedulingShell.client.tsx 생성 - SetlistMeetingsShell 패턴 재사용
   - 오버레이 모드 ListPane + 토글 버튼 + Esc/backdrop 닫기
3. /setlist-meetings/scheduling/layout.tsx 에 SchedulingShell 적용
4. scheduleStore에 isConfirmed(meetingId) 셀렉터 추가
5. 회의 클릭 시 /setlist-meetings/scheduling/{meetingId} 이동 + 패널 자동 닫힘

```tsx
// 진행도 계산 예시
const participantIds = meeting.participantUserIds ?? [];
const confirmedSongMembers = new Set(
  songs.filter(s => isReady(s)).flatMap(s => Object.values(s.confirmed).flat())
);
const totalMembers = confirmedSongMembers.size;
const completedCount = participantIds.filter(
  uid => schedules[`${meetingId}__${uid}`]?.completed
).length;
const pct = totalMembers ? Math.round(completedCount / totalMembers * 100) : 0;
```

**Test Strategy:**

1. SchedulingListPane 렌더링 확인 - 회의 목록 표시 여부
2. 진행도 게이지 계산 정확도 - 완료 멤버 수 / 전체 멤버 수
3. 시간표 확정 시 색상 전환 (bg-accent -> bg-success)
4. 회의 클릭 시 라우트 변경 및 패널 자동 닫힘
5. 토글 버튼 / Esc / backdrop 닫기 동작

## Subtasks

### 1.1. scheduleStore에 진행도 계산 셀렉터 추가

**Status:** pending  
**Dependencies:** None  

scheduleStore에 isConfirmed(meetingId) 셀렉터와 진행도 계산을 위한 getCompletedCount(meetingId, participantIds) 셀렉터를 추가합니다.

**Details:**

scheduleStore.ts에 다음 셀렉터/헬퍼 함수를 추가합니다:

1. `isConfirmed(meetingId: string): boolean` - 해당 회의의 모든 참여 멤버가 completed=true인지 확인
2. `getScheduleProgress(meetingId: string, participantIds: string[]): { completed: number; total: number }` - 완료된 멤버 수와 전체 참여 멤버 수 반환

구현 위치: src/domain/schedule-coordination/store/scheduleStore.ts의 Actions 인터페이스에 추가하고 구현합니다. 기존 getSchedule 패턴을 따라 get() 접근으로 schedules에서 meetingId__userId 키 패턴으로 조회합니다.

### 1.2. SchedulingListPane.client.tsx 생성 - 진행도 게이지 포함 회의 목록

**Status:** pending  
**Dependencies:** 1.1  

SetlistMeetingsListPane 패턴을 재사용하여 일정 조율 전용 회의 목록 패널을 생성합니다. 각 회의 카드에 일정 입력 진행도 게이지를 추가합니다.

**Details:**

src/app/(main)/setlist-meetings/scheduling/SchedulingListPane.client.tsx 파일 생성:

1. SetlistMeetingsListPane 구조 복제 (mode='overlay'|'fixed', open, onClose props)
2. MeetingRow 컴포넌트 수정:
   - 기존 ready/total 곡 진행도 대신 일정 입력 진행도 표시
   - 분모: 확정 곡 참여 멤버 합집합 (useSetlistStore의 songs에서 confirmed 멤버 추출)
   - 분자: scheduleStore의 completed=true 멤버 수
   - 색상: confirmedBoardId(또는 meeting.confirmedSlot) 있으면 bg-success, 없으면 bg-accent
3. 클릭 시 ROUTES.SETLIST_SCHEDULING_DETAIL(meeting.id)로 이동
4. listItemClasses, DOMAIN_TONES 재사용

진행도 계산 로직:
```tsx
const participantIds = meeting.participantUserIds ?? [];
const { completed, total } = getScheduleProgress(meetingId, participantIds);
const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
const isConfirmed = !!meeting.confirmedSlot;
```

### 1.3. SchedulingShell.client.tsx 생성 - 오버레이 패널 셸

**Status:** pending  
**Dependencies:** 1.2  

SetlistMeetingsShell 패턴을 재사용하여 일정 조율 영역의 마스터-디테일 셸 컴포넌트를 생성합니다.

**Details:**

src/app/(main)/setlist-meetings/scheduling/SchedulingShell.client.tsx 파일 생성:

1. SetlistMeetingsShell 구조 복제:
   - 좌측 토글 버튼 (PanelLeftOpen 아이콘, lg 이상에서만 표시)
   - Backdrop (열려있을 때만 bg-bg/40 backdrop-blur-sm)
   - SchedulingListPane mode='overlay' 연결
   - children 영역 (상세 페이지)
2. 상태 관리:
   - listOpen 상태 (useState)
   - pathname 변경 시 자동 닫힘 (useEffect)
   - Esc 키 핸들러로 닫기
   - ?listOpen=1 쿼리 파라미터로 초기 열림 지원
3. CSS 구조: relative flex h-full + Suspense 감싸기

기존 SetlistMeetingsShell과 동일한 UX 패턴을 유지하되, SchedulingListPane을 사용합니다.

### 1.4. scheduling 레이아웃에 SchedulingShell 적용

**Status:** pending  
**Dependencies:** 1.3  

/setlist-meetings/scheduling 경로 전용 layout.tsx를 생성하여 SchedulingShell을 적용합니다. 기존 fullPage 로직 수정.

**Details:**

1. src/app/(main)/setlist-meetings/scheduling/layout.tsx 파일 생성:
```tsx
import { SchedulingShell } from './SchedulingShell.client';

export default function SchedulingLayout({ children }: { children: React.ReactNode }) {
  return <SchedulingShell>{children}</SchedulingShell>;
}
```

2. src/app/(main)/setlist-meetings/layout.tsx 수정:
   - scheduling 경로 fullPage 조건 제거 (자체 레이아웃 사용)
   - ROUTES.SETLIST_SCHEDULING 관련 조건만 제거
   - /new 경로는 기존대로 fullPage 유지

3. src/global/config/routes.ts 확인:
   - SETLIST_SCHEDULING, SETLIST_SCHEDULING_DETAIL 라우트 이미 정의됨

4. 회의 클릭 시 패널 자동 닫힘:
   - SchedulingShell의 pathname 변경 감지 useEffect가 처리
