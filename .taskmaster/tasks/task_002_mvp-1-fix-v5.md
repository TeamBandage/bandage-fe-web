# Task ID: 2

**Title:** 선곡 회의 도메인 골격 — types + Zustand store + mock 시드

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** src/domain/setlist-meeting/ 도메인 모듈을 신규 생성하고, 타입 정의/Zustand store/mock 데이터 시드를 구현한다.

**Details:**

## 폴더 구조
```
src/domain/setlist-meeting/
├── types.ts        # Meeting, Song, Session, Applicant, ChatMessage
├── store/
│   └── setlistStore.ts
├── mock/
│   └── seed.ts     # TOOL TRIBUTE 7곡 + 마그마 1회의
├── utils.ts        # 세션 상태 헬퍼
└── components/     # (Phase E~H에서 추가)
```

## types.ts
```ts
export type SessionDef = {
  id: string; label: string; short: string; need: number; custom?: boolean;
};
export type Applicant = { userId: string; appliedAt: string; };
export type ChatMessage = { userId: string; at: string; msg: string; };
export type Song = {
  id: string; title: string; artist: string; album?: string;
  proposerId: string; note?: string;
  sessions: SessionDef[];
  applicants: Record<string, string[]>;   // sessionId → userId[]
  confirmed: Record<string, string[]>;
  chat: ChatMessage[];
};
export type Meeting = {
  id: string; bandId: string; bandName: string; title: string;
  managerId: string; createdAt: string; updatedAt: string;
};
```

## setlistStore.ts
```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SEED_MEETINGS, SEED_SONGS, SEED_MEMBERS } from '../mock/seed';

type State = {
  meetings: Meeting[];
  songs: Song[]; // 전체 곡 (meetingId별 필터는 클라이언트)
  members: Member[];
  selectedMeetingId: string | null;
  selectedSongId: string | null;
  focusedSessionId: string | null;
};
type Actions = {
  setSelectedMeeting: (id: string) => void;
  setSelectedSong: (id: string) => void;
  setFocusedSession: (id: string | null) => void;
  applySession: (songId: string, sessionId: string, userId: string) => void;
  withdrawSession: (songId: string, sessionId: string, userId: string) => void;
  confirmSession: (songId: string, sessionId: string, userId: string) => void;
  unconfirmSession: (songId: string, sessionId: string, userId: string) => void;
  sendChat: (songId: string, userId: string, msg: string) => void;
  addSong: (meetingId: string, song: Omit<Song, 'id' | 'chat' | 'applicants' | 'confirmed'>) => void;
  addCustomSession: (songId: string, session: SessionDef) => void;
};

export const useSetlistStore = create<State & Actions>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'bandage-setlist', storage: createJSONStorage(() => sessionStorage) },
  ),
);
```

## mock/seed.ts
- design/web/setlist_web.jsx의 W_MEETINGS, SL_SONGS_INIT, SL_MEMBERS 변환
- TOOL TRIBUTE 7곡 + 마그마 1회의

## utils.ts
```ts
export function sessionState(confirmed: string[], need: number): 'full' | 'partial' | 'empty';
export function isReady(song: Song): boolean;
export function missingCount(song: Song): number;
export function totalNeed(song: Song): number;
export function confirmedCount(song: Song): number;
```

**Test Strategy:**

1. Vitest 단위 테스트: store actions (applySession, withdrawSession 등) 호출 후 상태 변경 검증
2. utils 헬퍼 함수 단위 테스트 (sessionState, isReady, missingCount)
3. sessionStorage persist 확인: 브라우저 새로고침 후에도 사용자 액션(지원/채팅) 유지

## Subtasks

### 2.1. types.ts — 선곡 회의 도메인 타입 정의

**Status:** pending  
**Dependencies:** None  

setlist-meeting 도메인의 핵심 타입들(Meeting, Song, SessionDef, Applicant, ChatMessage, Member)을 정의한다.

**Details:**

## 파일 생성 경로
src/domain/setlist-meeting/types.ts

## 구현 상세
1. SessionDef 타입: id, label, short, need, custom 필드
2. Applicant 타입: userId, appliedAt 필드
3. ChatMessage 타입: userId, at, msg 필드 (design/web/setlist_web.jsx의 chat 배열 구조 참고)
4. Song 타입: id, title, artist, album, proposerId, note, sessions(SessionDef[]), applicants(Record<string, string[]>), confirmed(Record<string, string[]>), chat(ChatMessage[])
5. Meeting 타입: id, bandId, bandName, title, managerId, createdAt, updatedAt
6. Member 타입: id, name, role, avatar (SL_MEMBERS 구조 참고)

## 기존 패턴 참고
- src/global/types/api.ts의 ApiResponse, CursorResponse 래퍼 스타일 준수
- src/domain/band/types/req.ts, res.ts 분리 패턴 참고
- 향후 백엔드 DTO와 동기화를 고려한 네이밍 (SongResponse, MeetingResponse 등)

### 2.2. mock/seed.ts — TOOL TRIBUTE 7곡 + 마그마 1회의 mock 데이터

**Status:** pending  
**Dependencies:** 2.1  

design/web/setlist_web.jsx의 W_MEETINGS, SL_SONGS_INIT, SL_MEMBERS 데이터를 TypeScript 타입에 맞게 변환하여 mock 시드 데이터를 생성한다.

**Details:**

## 파일 생성 경로
src/domain/setlist-meeting/mock/seed.ts

## 구현 상세
1. SEED_MEMBERS: SL_MEMBERS 7명 변환 (정선우, 신선경, 지범준, 안성진, 이동후, 임지수, 최홍석)
2. SEED_MEETINGS: W_MEETINGS 2건 변환 (mt1: TOOL TRIBUTE '10,000 Days 전곡 합주 프로젝트', mt2: 마그마 '여름 공연 셋리스트')
3. SEED_SONGS: SL_SONGS_INIT 7곡 변환 (Vicarious, Jambi, Wings for Marie Pt1, 10,000 Days Pt2, The Pot, Right in Two, Rosetta Stoned)
   - 각 곡의 sessions, applicants, confirmed, chat 구조 유지
   - SL_TOOL_SESSIONS 기본 4세션(V, G, B, D) + 곡별 커스텀 세션(K, PERC, D2 등)
4. CURRENT_USER_ID: 'u1' (정선우) 상수 export

## 데이터 구조 주의점
- applicants[sessionId] = userId[] 형태
- confirmed[sessionId] = userId[] 형태
- chat의 uid → userId, at → at(문자열 유지)

### 2.3. setlistStore.ts — Zustand store 및 액션 구현

**Status:** pending  
**Dependencies:** 2.1, 2.2  

선곡 회의 상태 관리를 위한 Zustand store를 구현하고, 지원/취소/확정/채팅 등의 액션을 정의한다.

**Details:**

## 파일 생성 경로
src/domain/setlist-meeting/store/setlistStore.ts

## State 구조
- meetings: Meeting[]
- songs: Song[]
- members: Member[]
- selectedMeetingId: string | null
- selectedSongId: string | null
- focusedSessionId: string | null

## Actions 구현
- setSelectedMeeting(id: string): 선택된 회의 변경
- setSelectedSong(id: string): 선택된 곡 변경
- setFocusedSession(id: string | null): 포커스된 세션 변경
- applySession(songId, sessionId, userId): applicants 배열에 userId 추가
- withdrawSession(songId, sessionId, userId): applicants/confirmed에서 userId 제거
- confirmSession(songId, sessionId, userId): confirmed 배열에 userId 추가 (need 초과 방지)
- unconfirmSession(songId, sessionId, userId): confirmed에서 userId 제거
- sendChat(songId, userId, msg): chat 배열에 메시지 추가
- addSong(meetingId, song): 새 곡 추가
- addCustomSession(songId, session): 곡에 커스텀 세션 추가

## persist 설정
- name: 'bandage-setlist'
- storage: sessionStorage (authStore.ts 패턴 참고)
- SSR 안전 처리: typeof window 체크

### 2.4. utils.ts — 세션 상태 판정 헬퍼 함수

**Status:** pending  
**Dependencies:** 2.1  

sessionState, isReady, missingCount, totalNeed, confirmedCount 등 세션 상태 계산 유틸리티 함수를 구현한다.

**Details:**

## 파일 생성 경로
src/domain/setlist-meeting/utils.ts

## 함수 구현 (design/web/setlist_web.jsx 로직 참고)
1. sessionState(confirmed: string[], need: number): 'full' | 'partial' | 'empty'
   - confirmed.length >= need → 'full'
   - confirmed.length > 0 → 'partial'
   - otherwise → 'empty'

2. isReady(song: Song): boolean
   - 모든 세션이 'full' 상태인지 체크
   - song.sessions.every(s => sessionState(song.confirmed[s.id], s.need) === 'full')

3. missingCount(song: Song): number
   - 부족한 인원 수 합계
   - sessions.reduce((acc, s) => acc + Math.max(0, s.need - (confirmed[s.id]?.length || 0)), 0)

4. totalNeed(song: Song): number
   - 필요한 총 인원 수
   - sessions.reduce((acc, s) => acc + s.need, 0)

5. confirmedCount(song: Song): number
   - 확정된 총 인원 수
   - sessions.reduce((acc, s) => acc + (confirmed[s.id]?.length || 0), 0)

## 타입 import
- types.ts에서 Song, SessionDef 타입 import
