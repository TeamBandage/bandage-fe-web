# Task ID: 6

**Title:** 우측 세션 패널 — 지원/확정 기능 구현

**Status:** pending

**Dependencies:** 5

**Priority:** high

**Description:** SessionPanel 컴포넌트를 구현하여 곡별 세션 지원자 목록과 매니저 확정/해제 기능을 제공한다.

**Details:**

## 파일
```
src/domain/setlist-meeting/components/SessionPanel.client.tsx
```

## 두 가지 뷰 모드

### 1. 곡 전체 세션 카드 그리드 (focusedSessionId = null)
- 헤더: 곡명/아티스트, 매니저 배지(있으면)
- 추천자 의견 카드 (accent-dim 배경)
- 세션 카드 그리드:
  - 라벨 (V/G/B/D 등)
  - 확정 N/필요
  - 지원자 N명
  - 내가 지원함/확정됨 표시
- 카드 클릭 → setFocusedSession(sessionId)

### 2. 단일 세션 focus (focusedSessionId != null)
- '← 모든 세션' 버튼 → setFocusedSession(null)
- 세션 라벨 + 확정 칩 + 지원자 N / 필요 N
- 지원자 리스트:
  - 아바타/이름/역할
  - 확정된 사람: ✓ 배지
  - 매니저면 [확정]/[해제] 버튼
- 액션 버튼:
  - 미지원 → '이 세션 지원하기' (applySession)
  - 지원 + 미확정 → '지원 취소' (withdrawSession)
  - 확정 + 비매니저 → 취소 불가 안내

## 스타일
- 패널 너비: 380px (디테일 영역 우측 고정)
- border-left로 구분
- overflow-y-auto

**Test Strategy:**

1. 곡 행 클릭 시 우측 패널에 해당 곡 세션 정보 표시
2. '이 세션 지원하기' 클릭 → store.applySession 호출 → 지원자 목록 반영
3. 매니저 계정에서 [확정] 클릭 → store.confirmSession → 확정 상태 반영
4. 확정된 상태에서 비매니저는 취소 불가 안내 표시

## Subtasks

### 6.1. SessionPanel.client.tsx 기본 구조 및 곡 전체 세션 카드 그리드 뷰 구현

**Status:** pending  
**Dependencies:** None  

SessionPanel 컴포넌트의 기본 구조를 설정하고, focusedSessionId가 null일 때 표시되는 곡 전체 세션 카드 그리드 뷰를 구현한다.

**Details:**

src/domain/setlist-meeting/components/SessionPanel.client.tsx 파일 생성.

1. Props 타입 정의:
   - songId: string (선택된 곡 ID)
   - onClose?: () => void

2. useSetlistStore에서 필요한 상태/액션 가져오기:
   - songs, meetings, focusedSessionId, setFocusedSession
   - currentUserId (현재 사용자 판별용)

3. 헤더 영역 구현:
   - 곡명/아티스트 표시 (text-title + text-foreground-sub)
   - 매니저 배지 (song.recommenderId === meeting.managerId일 때 Badge 표시)

4. 추천자 의견 카드:
   - accent-dim 배경의 Card 컴포넌트 사용
   - song.recommenderComment 표시 (없으면 미표시)

5. 세션 카드 그리드:
   - 2열 그리드 (grid grid-cols-2 gap-s-3)
   - 각 세션 카드에:
     - 라벨 (V/G/B/D 등) - Chip 컴포넌트 재사용
     - 확정 N / 필요 N 표시 (utils의 confirmedCount, totalNeed 활용)
     - 지원자 N명 표시
     - 내가 지원함/확정됨 표시 (본인 userId와 대조)
   - 카드 클릭 → setFocusedSession(sessionId)

6. 스타일:
   - 패널 너비: w-[380px] 또는 min-w-[380px]
   - border-left: border-l border-border
   - overflow-y-auto
   - data-slot="session-panel" 부여

### 6.2. 단일 세션 focus 뷰 — 지원자 리스트 및 지원/취소 액션 구현

**Status:** pending  
**Dependencies:** 6.1  

focusedSessionId가 설정되었을 때 표시되는 단일 세션 상세 뷰를 구현한다. 지원자 리스트와 본인의 지원/취소 액션 버튼을 포함한다.

**Details:**

SessionPanel.client.tsx 내 focusedSessionId !== null 분기 구현.

1. 뒤로가기 버튼:
   - '← 모든 세션' 텍스트 버튼
   - onClick={() => setFocusedSession(null)}

2. 세션 헤더:
   - 세션 라벨 (Chip 컴포넌트)
   - 확정 칩: 확정 N / 필요 N 형식의 Badge
   - 지원자 N명 표시

3. 지원자 리스트:
   - ApplicantRow 서브컴포넌트 또는 인라인 구현
   - 각 지원자에:
     - Avatar (size="md", fallback={name})
     - 이름 표시 (getMemberDisplayName 활용)
     - 역할 표시 (text-foreground-sub text-xs)
     - 확정된 사람: 체크마크 Badge ('확정됨')
   - 빈 지원자 목록일 때 EmptyState 또는 간단한 안내 문구

4. 본인 액션 버튼 (하단 고정 영역):
   - 미지원 상태: '이 세션 지원하기' 버튼 (variant="primary")
     - onClick → store.applySession(songId, sessionId, currentUserId)
   - 지원 + 미확정 상태: '지원 취소' 버튼 (variant="ghost")
     - onClick → store.withdrawSession(songId, sessionId, currentUserId)
   - 확정 + 비매니저 상태: '확정된 세션은 취소할 수 없습니다' 안내 텍스트

5. 본인 지원 여부 판별 로직:
   - session.applicants.find(a => a.userId === currentUserId)
   - confirmedUserIds.includes(currentUserId)

### 6.3. 매니저 확정/해제 기능 — RoleGuard 기반 조건부 렌더링

**Status:** pending  
**Dependencies:** 6.2  

매니저 권한을 가진 사용자에게만 지원자 확정/해제 버튼을 표시하고, store의 confirmSession/unconfirmSession 액션과 연동한다.

**Details:**

SessionPanel.client.tsx 내 매니저 권한 로직 추가.

1. 매니저 판별:
   - const meeting = meetings.find(m => m.id === selectedMeetingId)
   - const isManager = meeting?.managerId === currentUserId

2. 지원자 리스트 내 매니저 전용 버튼:
   - isManager === true일 때만 각 지원자 행에 버튼 표시
   - 미확정 지원자: [확정] 버튼 (variant="secondary" size="sm")
     - onClick → store.confirmSession(songId, sessionId, applicantUserId)
   - 확정된 지원자: [해제] 버튼 (variant="ghost" size="sm")
     - onClick → store.unconfirmSession(songId, sessionId, applicantUserId)

3. 확정/해제 다이얼로그 (선택적):
   - Dialog 컴포넌트 사용
   - '정말 {이름}을(를) 확정하시겠습니까?' 확인
   - 또는 즉시 실행 (PRD에 명시 없으므로 즉시 실행 우선)

4. 버튼 로딩 상태:
   - Zustand store에서 pending 상태 관리 또는
   - 로컬 useState로 isConfirming/isUnconfirming 관리
   - Button의 loading prop 활용

5. Toast 피드백:
   - useToast 훅 사용
   - 확정 성공: toast.success('세션이 확정되었습니다.')
   - 해제 성공: toast.success('확정이 해제되었습니다.')
   - 에러 시: toast.error(err.message)

### 6.4. MeetingDetail과 SessionPanel 통합 및 반응형 레이아웃 연동

**Status:** pending  
**Dependencies:** 6.3  

MeetingDetail 컴포넌트와 SessionPanel을 연동하고, 곡 행/세션 셀 클릭 시 패널이 열리도록 구현한다. 패널 너비와 border 스타일을 적용한다.

**Details:**

MeetingDetail.client.tsx 수정 및 SessionPanel 연동.

1. MeetingDetail 레이아웃 수정:
   - 기존 구조: 헤더 + SongTable + ChatBox
   - 변경: flex 레이아웃으로 좌측(테이블+채팅) + 우측(SessionPanel) 분리
   - 우측 패널: selectedSongId가 있을 때만 렌더링

2. 상태 관리:
   - const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
   - 또는 useSetlistStore의 selectedSongId 활용

3. SongTable 연동:
   - 곡 행 클릭 핸들러: onSongClick={(songId) => setSelectedSongId(songId)}
   - 세션 셀 클릭 핸들러: onSessionClick={(songId, sessionId) => { setSelectedSongId(songId); setFocusedSession(sessionId); }}

4. SessionPanel 렌더링:
   - {selectedSongId && (<SessionPanel songId={selectedSongId} onClose={() => setSelectedSongId(null)} />)}

5. 스타일 조정:
   - 메인 컨텐츠 영역: flex-1 min-w-0
   - SessionPanel: w-[380px] shrink-0 border-l border-border
   - 전체 컨테이너: flex h-full

6. 패널 닫기:
   - SessionPanel 상단에 X 버튼 또는
   - 테이블 영역 클릭 시 패널 닫기 (선택적)

7. data-slot 속성:
   - 컨테이너: data-slot="meeting-detail-layout"
   - 패널: data-slot="session-panel"
