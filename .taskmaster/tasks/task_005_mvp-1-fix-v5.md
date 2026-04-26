# Task ID: 5

**Title:** 곡 표 (엑셀 형태) + 상단 헤더/필터 구현

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** /setlist-meetings/[meetingId] 라우트와 MeetingDetail, SongTable 컴포넌트를 구현하여 엑셀 형태의 곡 목록을 표시한다.

**Details:**

## 파일 구조
```
src/app/(main)/setlist-meetings/[meetingId]/
├── page.tsx
└── MeetingDetail.client.tsx

src/domain/setlist-meeting/components/
├── SongTable.client.tsx
└── SessionTrack.tsx
```

## page.tsx
```tsx
import { MeetingDetail } from './MeetingDetail.client';
export default function MeetingDetailPage({ params }: { params: { meetingId: string } }) {
  return <MeetingDetail meetingId={params.meetingId} />;
}
```

## MeetingDetail.client.tsx
- 상단 헤더:
  - 밴드명 (accent text-caption)
  - 회의 제목 (text-title font-bold)
  - 통계: 전체 N곡 / 합주 가능 N곡 / 모집 중 N곡
  - '곡 추가' 버튼 → AddSongModal 열기
- 필터 탭: 전체 | 합주 가능 | 모집 중 | 내 지원
- 검색 input: 곡명/아티스트 필터
- SongTable 렌더링
- 하단 채팅 split (Task 7에서 구현)

## SongTable.client.tsx
- <table> 형태 (design/web/setlist_web.jsx 참조)
- 컬럼: # | 곡명 | 아티스트 | 앨범 | 세션 점유 현황 | 추천자 의견 | 진행도
- 합주 가능 행: 좌측 success 보더 + 배경 톤 + ✓ 배지
- 행 클릭 → setSelectedSong + 세션 패널 오픈
- 세션 셀 클릭 → setFocusedSession

## SessionTrack.tsx
- 인라인 세션 미니 트랙
- Props: session, applicants, confirmed, active, mine, onClick
- 색상: full(success), partial(warn), empty(muted), mine(accent)
- 얇은 채움 막대 (ratio bar)

**Test Strategy:**

1. /setlist-meetings/mt1 접근 시 TOOL TRIBUTE 7곡 표 렌더링
2. 필터 탭 전환 시 곡 목록 필터링 동작
3. 검색 input에 "Vicarious" 입력 시 해당 곡만 표시
4. 합주 가능 곡(Jambi 등)에 success 보더 + ✓ 배지 표시
5. 세션 셀 클릭 시 focusedSession 상태 변경

## Subtasks

### 5.1. [meetingId] 라우트 및 page.tsx 구현

**Status:** pending  
**Dependencies:** None  

/setlist-meetings/[meetingId] 동적 라우트를 생성하고, MeetingDetail 클라이언트 컴포넌트를 렌더링하는 page.tsx를 구현합니다.

**Details:**

src/app/(main)/setlist-meetings/[meetingId]/ 폴더 구조를 생성합니다.

1. **page.tsx** - 서버 컴포넌트로 동적 라우트 파라미터 처리:
   - Next.js 15 App Router의 params가 Promise<{meetingId: string}> 타입
   - async function 내에서 await params로 meetingId 추출
   - MeetingDetail.client.tsx를 import하여 meetingId props 전달
   - Metadata export로 '선곡 회의 상세 | Bandage' 타이틀 설정

2. **파일 구조 준수**:
   - practices/[practiceId]/page.tsx 패턴 참조
   - RSC 우선 원칙: page.tsx는 서버 컴포넌트로 유지
   - 클라이언트 로직은 MeetingDetail.client.tsx로 분리

3. **구현 예시**:
```tsx
import type { Metadata } from 'next';
import { MeetingDetail } from './MeetingDetail.client';

export const metadata: Metadata = {
  title: '선곡 회의 상세 | Bandage',
};

type PageProps = {
  params: Promise<{ meetingId: string }>;
};

export default async function MeetingDetailPage({ params }: PageProps) {
  const { meetingId } = await params;
  return <MeetingDetail meetingId={meetingId} />;
}
```

### 5.2. MeetingDetail.client.tsx — 상단 헤더/필터/검색 구현

**Status:** pending  
**Dependencies:** 5.1  

상단 헤더(밴드명, 회의 제목, 통계), 필터 탭(전체/합주 가능/모집 중/내 지원), 검색 input을 포함하는 MeetingDetail 클라이언트 컴포넌트를 구현합니다.

**Details:**

src/app/(main)/setlist-meetings/[meetingId]/MeetingDetail.client.tsx 구현:

1. **'use client' 디렉티브 선언**

2. **상태 관리**:
   - selectedSong: string | null (선택된 곡 ID)
   - focusedSession: string | null (포커스된 세션 ID)
   - filter: 'all' | 'ready' | 'pending' | 'mine'
   - search: string (곡명/아티스트 검색어)
   - Task 2에서 구현될 setlistStore의 Zustand 훅 사용

3. **상단 헤더 영역**:
   - 밴드명: text-accent text-caption 스타일
   - 회의 제목: text-title font-bold
   - 통계 라인: '전체 N곡 / 합주 가능 N곡 / 모집 중 N곡' (success/warn 색상 적용)
   - '곡 추가' Button (우측 정렬, Plus 아이콘) → AddSongModal 연결 (Task 6)

4. **필터 탭**:
   - Tabs 컴포넌트 사용 (src/components/ui/tabs.tsx)
   - 4개 탭: 전체(all), 합주 가능(ready), 모집 중(pending), 내 지원(mine)
   - pill variant 스타일, 필터 상태와 연동

5. **검색 Input**:
   - Input 컴포넌트 (src/components/ui/input.tsx)
   - placeholder: '곡명, 아티스트로 검색...'
   - Search 아이콘 (lucide-react)
   - 입력값으로 songs 배열 필터링

6. **필터링 로직**:
   - filter 상태 + search 입력 조합으로 visible songs 계산
   - Task 2의 utils.ts 헬퍼(isReady, sessionState) 활용

7. **SongTable + 채팅 영역 placeholder**:
   - SongTable 컴포넌트 렌더링 (서브태스크 3)
   - 하단 채팅 split 영역 예약 (Task 7에서 구현)

### 5.3. SongTable.client.tsx — 엑셀 형태 곡 테이블 구현

**Status:** pending  
**Dependencies:** 5.1  

HTML <table> 기반의 엑셀 형태 곡 목록 테이블을 구현합니다. 컬럼: # | 곡명 | 아티스트 | 앨범 | 세션 점유 현황 | 추천자 의견 | 진행도

**Details:**

src/domain/setlist-meeting/components/SongTable.client.tsx 구현:

1. **Props 인터페이스**:
```tsx
interface SongTableProps {
  songs: Song[];  // 필터링된 곡 배열
  selectedSongId: string | null;
  focusedSessionId: string | null;
  currentUserId: string;
  onSelectSong: (songId: string) => void;
  onFocusSession: (songId: string, sessionId: string) => void;
}
```

2. **테이블 구조**:
   - <table> + <thead> sticky + <tbody>
   - 컬럼 헤더: # | 곡명 | 아티스트 | 앨범 | 세션 점유 현황 | 추천자 의견 | 진행도
   - 헤더: text-foreground-muted uppercase letterSpacing

3. **행 스타일링**:
   - 선택된 행: bg-accent-dim + accent 좌측 보더 3px
   - 합주 가능(ready) 행: bg-success-dim/7 + success 좌측 보더 3px
   - 합주 가능 곡: 곡명 앞에 success 배경 원형 체크마크 배지
   - 행 클릭 시 onSelectSong 호출 + 세션 패널 오픈

4. **컬럼별 구현**:
   - #: monospace, 2자리 패딩 (01, 02...)
   - 곡명: font-bold, 합주 가능 시 체크 배지 포함
   - 아티스트/앨범: text-foreground-sub/muted
   - 세션 점유 현황: SessionTrack 컴포넌트 inline-flex로 배치
   - 추천자 의견: 말줄임(...) 처리, 추천자 이름 prefix
   - 진행도: 프로그레스 바 + N/M 텍스트

5. **세션 셀 클릭 처리**:
   - e.stopPropagation()으로 행 선택과 분리
   - onFocusSession(songId, sessionId) 호출

6. **빈 상태**:
   - songs.length === 0일 때 '조건에 맞는 곡이 없습니다' 메시지

### 5.4. SessionTrack.tsx — 인라인 세션 미니 트랙 컴포넌트

**Status:** pending  
**Dependencies:** None  

테이블 내 세션 점유 현황을 표시하는 인라인 SessionTrack 컴포넌트를 구현합니다. 얇은 채움 막대와 상태별 색상을 지원합니다.

**Details:**

src/domain/setlist-meeting/components/SessionTrack.tsx 구현:

1. **Props 인터페이스**:
```tsx
interface SessionTrackProps {
  session: SessionDef;  // {id, label, short, need, custom?}
  applicants: string[];  // 지원자 userId 배열
  confirmed: string[];   // 확정된 userId 배열
  active: boolean;       // 현재 포커스 여부
  mine: boolean;         // 내가 지원했는지
  onClick: () => void;
}
```

2. **세션 상태 판정**:
   - full: confirmed.length >= need (success 색상)
   - partial: confirmed.length > 0 (warn 색상)
   - empty: confirmed.length === 0 (muted 색상)
   - mine: applicants에 현재 유저 포함 시 (accent 색상)

3. **레이아웃**:
   - 세로 정렬: 세션 라벨(short) + 채움 막대
   - 버튼 형태로 클릭 가능
   - minWidth: 30px, 가로 gap 14px 권장

4. **라벨 스타일**:
   - text-micro, monospace 폰트
   - 상태별 색상: success/warn/muted/accent
   - mine인 경우 underline + bold 강조
   - custom 세션: amber 색상 * 마커

5. **채움 막대(ratio bar)**:
   - 높이 2px, 회색 배경(border 색상)
   - ratio = confirmed.length / need (0~1)
   - 채움 영역: 상태 색상 적용
   - transition: width 0.2s

6. **Active 상태**:
   - active={true}일 때 accent outline 표시
   - outlineOffset: 4px

7. **접근성**:
   - title 속성: '${label} 확정 ${confirmed}/${need} · 지원 ${applicants}명'
