# Bandage 프론트가 필요로 하는 API — Phase 2 (선곡 회의 ~ 합주 확정 곡 매핑)

작성일: 2026-04-26
범위: **합주 일정 조율 도메인은 제외**. 선곡 회의 v1/v2 (Phase 1·2) 와 선곡 확정 → 합주곡 벌크 생성/매핑까지 FE 가 mock 으로 구현한 모든 표면.

연관 문서:

- [`API_SPEC.md`](./API_SPEC.md) — 백엔드 현재 스펙 (Auth, Member, Band, Practice, Practice Song, Performance)
- [`API_REQUIRED.md`](./API_REQUIRED.md) — 1차 BE 요청 모음(FE-API-001~043) — 일부 항목은 본 문서에서 더 상세화

본 문서는 백엔드가 새로 구현해야 할 **신규 도메인 1개(Setlist Meeting)** 와 **기존 도메인 보강 항목**을 한 번에 정리한다. 모든 항목은 현재 FE 가 mock 으로 우회 구현 중이며, BE 도입 시 `domain/{name}/api/` fetcher 만 교체하면 된다.

---

## 0. 신규 도메인 진단

### 0-1. 백엔드에 추가가 필요한 도메인

| 도메인              | 목적                                                             | 현재 FE 상태                                                  |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Setlist Meeting** | 선곡 회의 — 곡 풀 후보 선정 + 세션 매칭 + 매니저 확정 워크플로우 | Zustand persist(sessionStorage) mock-first. seed 7곡 + 2회의. |

### 0-2. 기존 도메인 보강이 필요한 항목

| 도메인        | 보강 내용                                                              | 사용처                                      |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Member        | 글로벌 멤버 검색(이름/이메일), `email`/`profileImg` 필드 노출          | 선곡 회의 만들기 마법사 Step 2 멤버 검색 탭 |
| Performance   | 검색 응답에 `bands[].members[]` 포함, 회의 만들기 시 자동 인원 풀 채움 | 선곡 회의 만들기 마법사 Step 2 공연 모드    |
| Practice Song | **벌크 생성** + 회의 곡 ↔ 합주곡 매핑 응답                             | 선곡 회의 매니저 확정 시                    |

### 0-3. 본 문서의 컨벤션

- 응답 스키마는 ApiResponse 래퍼(`{ success, message, data, timestamp }`) 를 가정하며, 본 문서는 `data` 의 형태만 명시.
- 일자/시각: ISO-8601 (KST 별도 표기 없음 — 클라이언트가 `Asia/Seoul` 로 변환).
- ID: 모두 UUID v4 가정.
- 페이징: 기존 `CursorResponse<T, C>` 패턴 유지 (`{ content, nextCursor, hasNext }`).
- 권한: 인증된 사용자가 기본. 추가 제약은 항목별 명시.

---

## 1. 선곡 회의 (Setlist Meeting) — 신규 도메인 설계

### 1-0. 도메인 개요

선곡 회의는 한 밴드(또는 공연 참여 밴드들)의 멤버들이 모여 합주할 곡 후보를 모으고, 각 세션 자리(보컬·기타·베이스 등)에 누가 들어갈지 협의해서 **매니저가 확정** 하는 협업 단위. 확정 시 회의의 곡들이 **합주곡(Practice Song)** 으로 벌크 생성되며, 공연 모드일 경우 공연의 셋리스트에도 자동 등록.

핵심 라이프사이클:

```
[생성] → [곡 추가/수정/삭제] → [세션 지원/철회/확정/해제] → [매니저 잠금(Lock)]
                  ↑                                                    ↓
                  ←────────── [매니저 잠금 해제(Unlock)] ←─────────── (필요 시 변경)
                                                                       ↓
                                                              [재잠금 — 변경분 동기]
```

### 1-1. 데이터 모델

#### `SetlistMeeting`

```kotlin
data class SetlistMeeting(
  val meetingId: UUID,
  val bandId: UUID,                      // 회의의 기준 밴드(공연 모드는 첫 참여 밴드)
  val title: String,                     // ex) "여름 페스티벌 셋리스트 회의"
  val purpose: MeetingPurpose,           // PERFORMANCE | GENERAL
  val performanceId: UUID?,              // purpose=PERFORMANCE 일 때 연결된 공연
  val managerId: UUID,                   // 회의 매니저(확정/해제 권한 보유)
  val createdBy: UUID,                   // 생성자
  val createdAt: Instant,
  val updatedAt: Instant,
  val lockedAt: Instant?,                // 매니저 확정 시점. null = 진행 중.
  val lockSnapshotSongIds: Set<UUID>?,   // 직전 잠금 시점의 곡 id 스냅샷(diff 계산용)
)

enum class MeetingPurpose { PERFORMANCE, GENERAL }
```

#### `SetlistMeetingMember` (참여 멤버)

```kotlin
data class SetlistMeetingMember(
  val meetingId: UUID,
  val userId: UUID,
  val joinedAt: Instant,
)
```

#### `SetlistSong` (회의 곡)

```kotlin
data class SetlistSong(
  val setlistSongId: UUID,
  val meetingId: UUID,
  val title: String,
  val artist: String,
  val album: String?,
  val duration: String?,                  // 'mm:ss'
  val proposerId: UUID,                   // 곡을 제안한 사용자
  val note: String?,                      // 추천자 의견
  val sessions: List<SessionDef>,         // 본 곡의 세션 정의 (V/G/B/D + 커스텀)
  val createdAt: Instant,
  val updatedAt: Instant,
  /** 매니저 확정(Lock) 시 BE 가 PracticeSong 을 생성하고 그 id 를 기록. */
  val practiceSongId: UUID?,
)

data class SessionDef(
  val sessionId: String,                  // 'V', 'G', 'G2', 'D', 'D2', 'S1', 'X_PERC' 등 (FE 내부 토큰)
  val label: String,                      // '보컬', '기타', '키보드' …
  val short: String,                      // 표시용 약어 (V/G/D 등 — 길어야 4자)
  val need: Int,                          // 정원(보통 1)
  val custom: Boolean,                    // FE 토큰 'X_*' 또는 BE 가 정의한 보조 세션
)
```

#### `SetlistSongApplicant` / `SetlistSongConfirmation`

```kotlin
data class SetlistSongApplicant(
  val setlistSongId: UUID,
  val sessionId: String,
  val userId: UUID,
  val appliedAt: Instant,
)

data class SetlistSongConfirmation(
  val setlistSongId: UUID,
  val sessionId: String,
  val userId: UUID,
  val confirmedBy: UUID,                  // 매니저 userId
  val confirmedAt: Instant,
)
```

#### `SetlistSongChatMessage`

```kotlin
data class SetlistSongChatMessage(
  val messageId: UUID,
  val setlistSongId: UUID,
  val userId: UUID,
  val message: String,                    // max 500
  val createdAt: Instant,
)
```

### 1-2. 권한 모델

| 액션                                    | 권한                                                             |
| --------------------------------------- | ---------------------------------------------------------------- |
| 회의 조회                               | 참여 멤버 (`SetlistMeetingMember`) 또는 매니저                   |
| 회의 생성                               | 인증 사용자(생성자=매니저 기본). 공연 모드는 공연 참여 밴드 멤버 |
| 회의 수정 (제목/매니저 변경)            | 매니저 또는 생성자                                               |
| 회의 삭제                               | 매니저                                                           |
| 곡 추가                                 | 참여 멤버. **잠금 상태에서는 차단**.                             |
| 곡 수정/삭제                            | 곡 제안자(`proposerId`) 또는 매니저. **잠금/확정된 곡은 차단**.  |
| 세션 지원/철회                          | 참여 멤버 본인. (`userId` 일치)                                  |
| 세션 확정/해제                          | 매니저만                                                         |
| 곡 채팅 작성/조회                       | 참여 멤버                                                        |
| **회의 잠금(Lock) / 잠금 해제(Unlock)** | 매니저만                                                         |
| 회의 곡 벌크 동기 (재확정)              | 매니저만                                                         |

### 1-3. 엔드포인트

> Base path: `/api/v1/setlist-meetings`. 모든 라우트 인증 필수.

#### 1-3-1. 회의 생성

```http
POST /api/v1/setlist-meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "여름 페스티벌 셋리스트 회의",
  "purpose": "PERFORMANCE",
  "performanceId": "uuid-or-null",
  "bandId": "uuid",
  "managerId": "uuid",
  "participantUserIds": ["uuid", "uuid", ...]
}
```

응답: `SetlistMeetingResponse` (생성된 메타).

검증:

- `purpose=PERFORMANCE` 일 때 `performanceId` 필수, 그 공연이 존재하고 createdBy 가 공연 참여 밴드 멤버.
- `managerId` 는 `participantUserIds` 에 포함되어야 함.
- 동일 `performanceId` 에 이미 활성 회의가 있으면 409 (FE 가 이미 블러처리하지만 서버 제약 필요).

> FE 사용처: `MeetingCreateWizard.client.tsx` Step 4.

#### 1-3-2. 회의 단건 조회

```http
GET /api/v1/setlist-meetings/{meetingId}
```

응답:

```json
{
  "meetingId": "uuid",
  "bandId": "uuid",
  "bandName": "TOOL TRIBUTE",
  "title": "10,000 Days 전곡 합주 프로젝트",
  "purpose": "GENERAL",
  "performanceId": null,
  "manager": { "userId": "uuid", "name": "정선우", "email": "..." },
  "participants": [{ "userId": "uuid", "name": "...", "email": "...", "profileImg": "..." }],
  "lockedAt": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### 1-3-3. 내 선곡 회의 목록 (커서 페이징)

```http
GET /api/v1/setlist-meetings/me?lastId=<uuid>&pageSize=20
```

응답: `CursorResponse<SetlistMeetingListItem, UUID>` — 내가 참여한 회의만. 각 아이템에 `total`, `ready` (확정 가능 곡 수) 메타 포함 권장.

> FE 사용처: 좌측 마스터 패널 (`SetlistMeetingsListPane.client.tsx`).

#### 1-3-4. 회의 수정

```http
PATCH /api/v1/setlist-meetings/{meetingId}
{
  "title": "...",
  "managerId": "uuid"
}
```

매니저 변경 시 새 매니저는 참여자에 포함되어야 함.

#### 1-3-5. 회의 삭제

```http
DELETE /api/v1/setlist-meetings/{meetingId}
```

응답 204. 매니저만. cascade — 곡/지원/확정/채팅/lock 정보 모두 정리.

#### 1-3-6. 곡 목록 조회

```http
GET /api/v1/setlist-meetings/{meetingId}/songs?lastId=<uuid>&pageSize=50
```

응답: `CursorResponse<SetlistSongResponse, UUID>` — 응답에 sessions·applicants·confirmed 포함 권장(FE 가 한 번에 표시).

#### 1-3-7. 곡 단건 조회

```http
GET /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}
```

#### 1-3-8. 곡 생성 (회의 진행 중)

```http
POST /api/v1/setlist-meetings/{meetingId}/songs
{
  "title": "Vicarious",
  "artist": "Tool",
  "album": "10,000 Days",
  "duration": "07:06",
  "note": "폴리리듬 도입부…",
  "sessions": [
    { "sessionId": "V", "label": "보컬", "short": "V", "need": 1, "custom": false },
    ...
  ]
}
```

응답: 생성된 `SetlistSongResponse` (빈 applicants/confirmed 버킷).

회의가 잠금 상태(`lockedAt != null`) 면 409 또는 423.

#### 1-3-9. 곡 부분 수정

```http
PATCH /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}
{
  "title": "...", "artist": "...", "album": "...", "duration": "...", "note": "...",
  "sessions": [...]    // optional - 변경 시 새 세션 list 그대로 교체
}
```

수정 권한: 곡 제안자 또는 매니저. 잠금 상태에서는 차단. 또한 본 곡이 `isReady`(모든 세션 정원 충족) 인 경우에도 차단 권장(데이터 무결성). FE 는 이미 isReady 일 때 수정 버튼 비활성.

`sessions` 변경 시 응답 측에서 제거된 세션의 applicants/confirmed 는 cascade 정리하고 응답으로 정리된 객체 반환.

#### 1-3-10. 곡 삭제

```http
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}
```

응답 204. 권한: 곡 제안자 또는 매니저. 잠금 상태에서는 차단.

#### 1-3-11. 세션 지원

```http
POST /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}/sessions/{sessionId}/applicants
```

본인만 (path userId 추론은 토큰에서). 중복 지원은 멱등 200.

#### 1-3-12. 세션 지원 철회

```http
DELETE /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}/sessions/{sessionId}/applicants/{userId}
```

본인만(`userId` 가 토큰의 user 와 일치). cascade — 해당 세션 confirmed 에 본인 있다면 함께 제거.

#### 1-3-13. 세션 확정 / 해제 (매니저)

```http
PATCH /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}/sessions/{sessionId}/confirmations
{
  "confirm":   ["uuid", "uuid"],
  "unconfirm": ["uuid"]
}
```

응답: 갱신된 세션 객체. 정원(`need`) 초과 confirm 시 400. 매니저만.

#### 1-3-14. 곡별 채팅 조회 (커서 페이징)

```http
GET /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}/chat?lastId=<uuid>&pageSize=50
```

응답: `CursorResponse<SetlistSongChatMessageResponse, UUID>` — 최신순.

#### 1-3-15. 곡별 채팅 작성

```http
POST /api/v1/setlist-meetings/{meetingId}/songs/{setlistSongId}/chat
{ "message": "보컬 음역대 빡셈" }
```

응답: 생성된 메시지(생성자 정보 포함). 본인 작성. max 500자.

#### 1-3-16. 회의 잠금 (선곡 확정)

```http
POST /api/v1/setlist-meetings/{meetingId}/lock
```

서버 책임:

1. 매니저 권한 검증.
2. 현재 회의 곡 목록 스냅샷을 `lockSnapshotSongIds` 에 저장.
3. **합주곡 벌크 생성** — `SetlistSong` 의 `practiceSongId` 가 `null` 인 항목은 새 `PracticeSong` 을 만들어 매핑 (1-3-17 와 연계).
4. **공연 모드** 일 때 매핑된 `practiceSongId` 들을 `Performance.setlist` 에 자동 등록.
5. `lockedAt` 갱신, `lockSnapshotSongIds` 갱신.

응답:

```json
{
  "lockedAt": "2026-04-26T12:30:45Z",
  "songs": [{ "setlistSongId": "uuid", "practiceSongId": "uuid" }]
}
```

#### 1-3-17. 회의 잠금 해제

```http
POST /api/v1/setlist-meetings/{meetingId}/unlock
```

매니저만. `lockedAt` 을 null 로. **`lockSnapshotSongIds` 와 `practiceSongId` 매핑은 유지** — 다음 재잠금에서 변경분 diff 계산 기준.

#### 1-3-18. 재잠금 시 변경분 동기 (벌크 수정)

```http
PATCH /api/v1/setlist-meetings/{meetingId}/songs/bulk
{
  "add": [
    { "tempId": "...", "title": "...", "artist": "...", "sessions": [...] }
  ],
  "remove": ["setlistSongId-uuid"],
  "update": [
    { "setlistSongId": "uuid", "title": "...", "sessions": [...] }
  ]
}
```

서버 책임:

1. add — 신규 `SetlistSong` 생성 + `PracticeSong` 도 생성, 매핑 기록.
2. remove — `SetlistSong` 삭제 + 연결된 `PracticeSong` 도 삭제(또는 soft-delete).
3. update — 메타 필드 갱신. `sessions` 변경 시 cascade 정리.
4. 응답: 새로 매핑된 `practiceSongs: [{ setlistSongId, practiceSongId }]`.

이 엔드포인트는 1-3-16 의 lock 호출에 앞서 FE 가 호출 가능. 또는 1-3-16 lock 이 내부적으로 diff 처리하도록 선택할 수 있음. **FE 권장 시퀀스**: 매니저 잠금 해제 후 추가/수정/삭제가 발생했다면, 다음 lock 직전에 `bulk` 로 일괄 동기 → 그 후 `lock` 호출. 또는 `lock` 단건이 `bulk` 까지 수행하도록 일원화 가능 (BE 결정).

---

## 2. Member 도메인 보강

### 2-1. 글로벌 멤버 검색 (FE-API-032 상세화)

```http
GET /api/v1/members/search?q=&limit=20
```

응답:

```json
[{ "memberId": "uuid", "name": "박지윤", "email": "jiyun@…", "profileImg": "..." }]
```

검증:

- `q` 는 최소 1자. 빈 값이면 빈 배열.
- 매칭은 `name` / `email` 부분 일치(대소문자 무시).
- 본인은 결과에서 제외할지 BE 정책으로 결정 (FE 는 둘 다 처리 가능).

> FE 사용처: 회의 만들기 마법사 Step 2 '멤버 검색' 탭, 향후 `MemberPickerModal` 등.

### 2-2. Member 응답 스키마에 `email` / `profileImg` 노출

기존 `MemberInfoResponse`(2-2 내 정보) 와 `BandMemberInfoResponse`(3-4) 양쪽에 `email`, `profileImg` 추가. FE 의 `MemberAvatar` 가 hex 색 + 이니셜 → 실제 프로필 사진으로 자연 마이그레이션.

---

## 3. Performance 도메인 보강

### 3-1. 공연 검색 응답에 멤버 풀 포함 (선곡 회의 만들기 Step 1·2)

기존 §6-2-2 (공연 검색) 응답을 확장:

```json
{
  "content": [
    {
      "performanceId": "uuid",
      "title": "여름 합주 페스티벌",
      "venue": "클럽 FF",
      "startAt": "2026-08-15T19:00+09:00",
      "bands": [
        {
          "bandId": "uuid",
          "bandName": "TOOL TRIBUTE",
          "members": [{ "userId": "uuid", "name": "...", "email": "...", "profileImg": "..." }]
        }
      ]
    }
  ]
}
```

FE 가 회의 만들기 Step 2 (공연 모드) 에서 참여 멤버 풀을 자동 채우는 데 사용. 응답 크기 우려 시 `?include=members` 같은 옵션으로 선택적 노출도 가능.

### 3-2. 공연의 활성 선곡 회의 존재 여부 노출

`PerformanceDetailResponse` 또는 `PerformanceListItemResponse` 에 `hasActiveSetlistMeeting: boolean` 추가:

- 회의 만들기 마법사 Step 1 에서 "이미 회의가 생성된 공연" 을 블러 처리하는 데 사용.
- 회의 한 개당 한 공연 = 1:1 정책 (BE 정책으로 결정 — 1:n 도 허용 가능).

---

## 4. Practice Song 도메인 보강 — 벌크 생성/매핑

선곡 회의 잠금(1-3-16) 또는 벌크 동기(1-3-18) 시 BE 가 합주곡을 일괄 생성/매핑하기 위한 내부 표면.

### 4-1. 벌크 생성

기존 §5-2 / §5-3 단건 생성을 확장한 내부 엔드포인트(또는 선곡 회의 잠금이 트랜잭션으로 감싸 호출):

```http
POST /api/v1/practice-songs/bulk
{
  "songs": [
    { "title": "...", "artist": "...", "album": "...", "duration": "..." }
  ]
}
```

응답: 생성된 `practiceSong` 배열(요청 순서 유지).

### 4-2. 합주곡 ↔ 선곡 회의 곡 매핑 표면

`PracticeSong` 에 `originSetlistSongId: UUID?` 필드 추가 권장. 추적/역방향 조회/회의 재확정 시 동기화 모두 단순해짐.

이미 §5-1 합주곡 검색은 존재하므로 — 본 도메인은 신규 엔드포인트 1개(벌크) + 매핑 필드 1개 추가가 핵심.

---

## 5. FE 우회 현황 — 본 라운드 종료 시점

| 영역                                | FE mock 위치                                                     | 백엔드 도입 시 fetcher 교체 지점                               |
| ----------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| 회의 CRUD / 곡 / 세션 / 채팅        | `domain/setlist-meeting/store/setlistStore.ts` (Zustand persist) | 위 store actions → `domain/setlist-meeting/api/*` fetcher 호출 |
| 회의 잠금/해제/벌크 동기            | `setlistStore.lockMeeting` / `unlockMeeting` (단순 mock 매핑)    | 1-3-16 / 1-3-17 / 1-3-18 호출                                  |
| 글로벌 멤버 검색                    | `domain/setlist-meeting/mock/memberSearchMock.ts` (12명 정적)    | 2-1 GET /members/search                                        |
| 공연 검색 (회의 만들기용)           | `domain/setlist-meeting/mock/performanceSearchMock.ts`           | 3-1 강화된 GET /performances/search?include=members            |
| 외부 곡 DB 검색                     | `domain/setlist-meeting/mock/songSearchMock.ts` (30곡)           | 별도 SONG 검색 API (이전 라운드 FE-API-024~030 일부)           |
| 회의 매니저 확정 → 합주곡 벌크 생성 | `lockMeeting` 의 임시 `practiceSongMap`                          | 1-3-16 응답 + §4 벌크 생성 트랜잭션                            |

---

## 6. 활성화 절차 (BE 도입 시)

1. 신규 도메인 — `Setlist Meeting` 모델 + 엔드포인트 모두 추가 후 [`API_SPEC.md`](./API_SPEC.md) 에 §7 로 편입.
2. Member / Performance 응답 스키마 확장 ([`API_SPEC.md`](./API_SPEC.md) §2, §6 갱신).
3. PracticeSong 에 `originSetlistSongId` 마이그레이션 + 벌크 생성 엔드포인트 추가 ([`API_SPEC.md`](./API_SPEC.md) §5).
4. 프론트 `domain/setlist-meeting/api/` 폴더를 생성하고 store action 을 fetcher 로 교체. mock 모듈은 `__mocks__` 또는 dev-only 로 격리.
5. 통합 검증 — 회의 생성 → 곡 추가/지원/확정 → 잠금 → 합주곡 벌크 생성/매핑 → 잠금 해제 → 변경 → 재잠금(diff 동기) 시퀀스를 `.taskmaster/report/setlist-meeting-integration-YYYY-MM-DD.md` 로 검증 리포트 작성.

---

## 7. 비범위

- **합주 일정 조율(Schedule Coordination)** — 본 문서 범위 외. 별도 라운드(`API_REQUIRED.md` FE-API-040~043) 에서 처리.
- 알림(푸시/메일) — 회의 잠금/멤버 합류 등 이벤트 트리거는 추후 별도 PRD.
- AI 자동 입력 / 외부 음원 DB 직접 연결 — 본 라운드는 mock 만.
