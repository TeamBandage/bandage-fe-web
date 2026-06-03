# 선곡 회의 Phase 2 PRD

작성일: 2026-04-26
영향 도메인: `domain/setlist-meeting`, `domain/practice-song`, `domain/performance`
선행 라운드: mvp-1-fix-v5 (선곡 회의 v1 출시 — Zustand mock-first)

## 0. 배경 / 목적
mvp-1-fix-v5 에서 선곡 회의 v1 (mock 기반 단일 곡 추가, 매니저 확정/재개) 을 출시. Phase 2 는 회의 생성 워크플로우를 본격적으로 구축하고, 선곡 확정 시 합주곡 벌크 생성/매핑까지 이어지는 BE 연동 표면을 정의한다.

## 1. 범위 요약
1. 좌측 사이드바의 '선곡 회의' 항목 아래에 서브탭 신설: **회의 만들기** / **나의 선곡 회의**
2. **회의 만들기**: 합주 생성 마법사 패턴을 그대로 따른 풀페이지 시퀀스
   1) 회의 목적 선택 (공연 선곡 회의 / 일반 합주 회의)
   2) 참여 인원 선택 (목적에 따라 분기)
   3) 회의 정보 (제목 + 매니저 지정)
   4) 확인
3. **나의 선곡 회의**: 기존 디테일 라우트 진입 + 좌측 마스터 패널을 자동 펼침
4. **선곡 확정 ↔ 합주곡 벌크 매핑**: 매니저 확정 시 확정된 곡들을 PracticeSong 벌크 생성/연결, 재개→재확정 시 변경분 BE 벌크 수정 API 로 동기

## 2. 사용자 시나리오

### 2-1. 회의 만들기
1. 좌측 사이드바 '선곡 회의 > 회의 만들기' → `/setlist-meetings/new` 마법사 열림
2. **Step 1: 목적 선택** (언더라인 탭 형태의 옵션)
   - **공연 선곡 회의** — "공연 셋리스트를 생성합니다"
     - 공연 선택 모달: 검색 input + 결과 리스트 (제목/장소/일시)
     - "공연 즉시 생성" CTA → `/performances/new` 로 리다이렉트(돌아오면 직전 mode 유지 시도)
   - **일반 합주 회의** — "합주곡 목록을 생성합니다 (합주곡 벌크 생성 목적)"
3. **Step 2: 참여 인원**
   - 공연 모드: 공연에 참여한 모든 밴드의 멤버 풀을 평면화 → 기본 전체 체크 → 사용자가 토글로 제외/포함
   - 일반 모드: 언더라인 탭 (밴드 검색 / 멤버 검색)
     - 밴드 검색: 밴드 선택 시 그 밴드 멤버를 import → 자동 추가
     - 멤버 검색: 이메일/이름으로 검색 (검색 input + 결과 리스트, 프로필 이미지 + 이름/이메일 표기)
4. **Step 3: 회의 정보**
   - 회의 제목 (필수)
   - 매니저 지정: Step 2 에서 모은 참여 멤버 풀 중 한 명을 라디오로 선택 (모달 X, 풀페이지 내 스크롤 리스트)
5. **Step 4: 확인**
   - 모든 정보 요약 (목적, 공연/밴드 정보, 참여 인원 수, 매니저)
   - '회의 만들기' 클릭 → store/BE 생성 → `/setlist-meetings/{id}` 디테일로 리다이렉트

### 2-2. 나의 선곡 회의
- 좌측 사이드바 '선곡 회의 > 나의 선곡 회의' 클릭 → `/setlist-meetings` 로 진입하면서 좌측 마스터 패널 자동 펼침. 이후 동작은 현재와 동일.

### 2-3. 선곡 확정 → 합주곡 벌크 매핑
- 매니저가 '선곡 확정' 클릭 → 확정 시점의 곡 목록을 BE 로 전달:
  - **공연 모드**: 공연의 셋리스트로 등록 + 각 곡을 PracticeSong 벌크 생성, songId 를 회의 곡 아이템에 기록
  - **일반 모드**: 곡들을 PracticeSong 벌크 생성, songId 를 회의 곡 아이템에 기록
- 매니저가 '회의 재개' → 다시 변경 후 '선곡 확정' → 변경분(추가/제거/수정)을 BE 회의 정보 벌크 수정 API 로 전송
- FE 책임: 변경 사항 diff 계산(추가/제거/수정 곡), API 호출, 결과로 받은 songId 를 setlistStore 에 반영

## 3. 라우트
- `/setlist-meetings` — 기존 마스터-디테일
- `/setlist-meetings/new` — 신규 마법사 (Step 1~4)
- `/setlist-meetings/{meetingId}` — 디테일 (기존)
- 사이드바 NavRow 의 subs:
  - 회의 만들기 → `/setlist-meetings/new`
  - 나의 선곡 회의 → `/setlist-meetings?listOpen=1` (쿼리 파라미터로 마스터 패널 자동 펼침 신호)

## 4. UI 가이드라인
- 마법사 풀페이지: PracticeCreateWizard / PerformanceCreateWizard 의 StepIndicator + 좌우 nav 버튼 패턴 그대로
- 상단 옵션 / 하위 검색 탭: 모두 `<Tabs variant="underline">` 사용 (모달도 동일)
- 멤버 검색 결과 컴포넌트: `MemberSearchRow` (Avatar + 이름 + 이메일)
- 매니저 선택은 라디오, 참여 멤버 선택은 체크박스
- 잠금 시: 기존 v1 의 잠금 배너 유지

## 5. 도메인 / 데이터 모델 변경

### 5-1. types.ts
```ts
export type MeetingPurpose = 'performance' | 'general';

export type Meeting = {
  // ... 기존 필드
  purpose: MeetingPurpose;
  performanceId?: string | null;        // purpose='performance' 일 때
  participantUserIds: string[];          // 참여 멤버 userId 목록
  /** 매니저 확정 시 BE 연동을 위한 매핑. songId(회의) → practiceSongId(BE 응답). */
  practiceSongMap?: Record<string, string>;
};

export type Member = {
  // ... 기존
  email?: string;       // 멤버 검색 표기용
  profileImg?: string;  // Avatar src
};
```

### 5-2. setlistStore
- `addMeeting` 시그니처 확장: `{ title, bandId, bandName, managerId, purpose, performanceId?, participantUserIds }`
- `lockMeeting(meetingId)` → 확정 시점 곡 스냅샷을 별도 `lockSnapshot` 으로 저장 (재개→재확정 diff 계산용)
- `unlockMeeting(meetingId)` → lockSnapshot 유지(다음 확정에서 비교)
- `commitConfirmDiff(meetingId)` 신규 액션: 현재 곡 목록과 lockSnapshot 비교 → BE 호출 mock → practiceSongMap 갱신

### 5-3. mock 확장
- SEED_MEMBERS 에 email/profileImg 추가
- `mock/memberSearchMock.ts` 신규 — 글로벌 멤버 풀(밴드 무관) 검색용 mock
- `mock/performanceSearchMock.ts` 신규 — 공연 검색용 mock (제목/장소/일시)

## 6. 백엔드 요청 (API_REQUIRED 추가)
### FE-API-031 회의 생성 (확장)
```
POST /api/v1/setlist-meetings
Body: { title, bandId, purpose: 'PERFORMANCE'|'GENERAL', performanceId?, managerId, participantUserIds }
```
### FE-API-032 멤버 검색 (글로벌)
```
GET /api/v1/members/search?q=&limit=20
Response: [{ memberId, name, email, profileImg? }]
```
권한: 인증된 사용자.

### FE-API-033 공연 검색 (셋리스트 회의용)
```
GET /api/v1/performances/search?q=&limit=20
Response: [{ performanceId, title, venue, startAt, bands: [...]}]
```

### FE-API-034 회의 확정 → 합주곡 벌크 생성/연결
```
POST /api/v1/setlist-meetings/{id}/lock
Body: {
  songs: [{ meetingSongId, title, artist, album?, duration?, sessions: [...] }]
}
Response: {
  lockedAt: ISO,
  practiceSongs: [{ meetingSongId, practiceSongId }]
}
```
- 공연 모드일 때 BE 가 자동으로 performance.setlist 에도 추가 (서버 측 트리거)

### FE-API-035 회의 잠금 해제
```
POST /api/v1/setlist-meetings/{id}/unlock
```

### FE-API-036 회의 변경분 벌크 수정 (재확정 시)
```
PATCH /api/v1/setlist-meetings/{id}/songs/bulk
Body: {
  add: [{ tempId, title, ... }],
  remove: [meetingSongId],
  update: [{ meetingSongId, ...patch }]
}
Response: {
  practiceSongs: [{ meetingSongId, practiceSongId }] // 새로 매핑된 항목들
}
```

## 7. 작업 분할 (태스크 후보)
1. 라우트 + 사이드바 서브탭 + `/setlist-meetings?listOpen=1` 자동 펼침
2. 마법사 셸 (`/setlist-meetings/new`) — StepIndicator + 좌우 nav + 상태 컨텍스트
3. Step 1: 목적 선택 (언더라인 탭 + 공연 선택 모달 + '공연 즉시 생성' 리다이렉트)
4. Step 2: 참여 인원
   - 공연 모드: 공연 멤버 풀 자동 채움 + 토글 체크박스 리스트
   - 일반 모드: 밴드 검색 / 멤버 검색 언더라인 탭
   - 멤버 검색 결과 컴포넌트(`MemberSearchRow`) + mock
5. Step 3: 회의 정보 (제목 + 매니저 라디오 풀페이지 스크롤)
6. Step 4: 확인 + 생성(store.addMeeting 확장 + 디테일 리다이렉트)
7. 도메인 모델 확장: types/store/seed/mock(`memberSearchMock`, `performanceSearchMock`) + Member email/profileImg
8. 선곡 확정 시 합주곡 벌크 생성/매핑 (mock 우선) — store.commitConfirmDiff + lockSnapshot
9. API_REQUIRED.md 에 FE-API-031~036 등록 + 산출물 정리

## 8. 비범위 (Out of scope)
- 실제 BE 호출 — 본 라운드는 mock-first. 도입 시 fetcher 만 교체.
- 알림/푸시
- 외부 음원 DB 연동 (이미 v5 에서 mock 화)

## 9. 활성화 절차 (BE 도입 시)
1. FE-API-031~036 명세를 `API_SPEC.md` 에 정의
2. `domain/setlist-meeting/api/` 의 fetcher 시그니처 갱신
3. setlistStore 의 addMeeting/lockMeeting/commitConfirmDiff 를 fetcher 호출로 교체
4. mock 검색 헬퍼(`searchMockSongs`/`memberSearchMock`/`performanceSearchMock`) 를 실제 API 로 교체
