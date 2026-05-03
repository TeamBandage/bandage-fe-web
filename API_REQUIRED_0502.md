# API_REQUIRED_0502.md

작성일: 2026-05-02
작성자: FE
대상 문서: `API_SPEC.md` (v3, 2026-04-26), `API_REQUIRED.md`, `API_REQUIRED_2.md`

---

## 0. 개요

`API_REQUIRED.md`(FE-API-001~043) 와 `API_REQUIRED_2.md` (선곡 회의 Phase 2) 이후, FE 에서 다음 두 도메인이 **완전 mock(Zustand persist)** 상태로 추가/확장되었다. 본 문서는 그 mock 들을 항목별로 식별하고, 실제 백엔드 도입 시 필요한 엔드포인트·DTO·도메인 설계를 정리한다.

### 0-1. 상태 요약

| 도메인                                                                   | FE 구현                                               | BE 스펙              | 상태                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------- | ------------------------------------- |
| Auth / Member / Band / Practice / Performance                            | 실제 API 호출                                         | API_SPEC §1~§6       | 정상                                  |
| Practice-Song 검색                                                       | 실제 호출                                             | API_SPEC §5-1        | BE 가 Tool 곡 고정 mock 반환 (요수정) |
| Setlist Meeting (Phase 1 CRUD/세션/잠금)                                 | mock(setlistStore) — fetcher 만 준비                  | API_SPEC §7          | BE 미구현                             |
| Setlist Meeting (Phase 2 — purpose/performanceId/participants/diff lock) | mock                                                  | API_REQUIRED_2 §1~§4 | BE 미구현                             |
| **Schedule Coordination (합주 일정 조율 v2/v3)**                         | **mock(scheduleStore + boardStore + timetableStore)** | **미정**             | **본 문서에서 신규 정의**             |

### 0-2. 본 문서에서 신규 추가/보완하는 항목

- §1. Schedule Coordination 도메인 — 신규 엔드포인트 군 정의 (FE-API-050~062)
- §2. Setlist Meeting ↔ Schedule Coordination 연결 — 회의 확정→합주 자동 생성 흐름
- §3. Setlist Meeting Phase 2 미해결 항목 보강 (FE-API-063~065)
- §4. Performance 검색 응답 보강 (FE-API-066) — bands[].members[]
- §5. Practice-Song 마스터 검색 백엔드 보강 (FE-API-067)
- §6. 도메인 설계 권고 — Spring Modulith 모듈 경계, 테이블, 권한, 트랜잭션

---

## 1. Schedule Coordination 도메인 (신규)

> 선곡 회의가 잠긴 뒤, 멤버별 가용 시간을 수집하여 매니저가 시간표 시안을 만들고 한 시안을 확정하면 실제 `Practice` 가 일괄 생성되는 워크플로우.

FE 위치: `src/domain/schedule-coordination/`

### 1-1. 도메인 모델

#### MemberSchedule (멤버별 가용 시간 제출)

- `meetingId`: String (UUID, FK → SetlistMeeting)
- `userId`: Long (FK → Member)
- `availableDates`: List<LocalDate> — "가능"으로 명시한 날짜
- `unavailableDates`: List<LocalDate> — "불가능"으로 명시한 날짜 (둘 다 미선택 = 미응답)
- `blocks`: Map<LocalDate, BitSet(48)> — 30분 슬롯 단위 (0=00:00, 47=23:30)
- `note`: String (멤버 메모, nullable, max 500)
- `completed`: Boolean — 마법사 완료 여부 (부분 입력도 저장)
- `updatedAt`: Instant

식별성: `(meetingId, userId)` 1:1 (upsert 의미).

#### ScheduleBoard (매니저가 만드는 시간표 시안)

- `boardId`: String (UUID)
- `meetingId`: String (FK)
- `name`: String (max 50)
- `paletteSeed`: Int (UI 컬러 토큰 시드 — 0~9)
- `confirmed`: Boolean — 한 회의당 최대 1개만 true
- `constraints`: ScheduleBoardConstraints (embedded)
- `createdAt`, `updatedAt`: Instant

제약: 한 `meetingId` 당 최대 5개 (FE 상수 `SCHEDULE_BOARD_LIMIT=5` 와 일치).

#### ScheduleBoardConstraints (embedded)

- `workingHoursStart`: Int (0~47, default 18 = 09:00)
- `workingHoursEnd`: Int (0~48, default 44 = 22:00)
- `excludeLateNight`: Boolean (default true)
- `maxConsecutiveMinutes`: Int (default 240)

#### ScheduleBlock (시안 안의 합주 블록)

- `blockId`: String (UUID, board 내 unique)
- `boardId`: String (FK)
- `songId`: String — 회의의 song(item) id 참조 (purpose=performance 면 lock 후 PracticeSongId 매핑 가능)
- `date`: LocalDate
- `startSlot`: Int (0~47)
- `durationSlots`: Int (≥ 1)
- `pinned`: Boolean (자동 재배치 시 이동 금지)
- `paletteIndex`: Int (0~9)
- `songTitleOverride`: String (nullable)
- `note`: String (nullable, max 200)

검증: `startSlot + durationSlots ≤ 48`, `date` 는 회의의 `practiceWindow.from..to` 범위 내, 동일 boardId 내 (date,startSlot) 충돌 금지(겹침 정책은 1-7 참고).

### 1-2. 권한

| 작업                          | LEADER            | ADMIN      | MEMBER (참여자) | MEMBER (비참여자) |
| ----------------------------- | ----------------- | ---------- | --------------- | ----------------- |
| 자기 MemberSchedule 조회/수정 | O                 | O          | O               | X (403)           |
| 다른 멤버 MemberSchedule 조회 | O (회의 매니저만) | O (매니저) | X               | X                 |
| 회의 종합(aggregate) 조회     | O (참여자 전부)   | O          | O               | X                 |
| ScheduleBoard 생성/수정/삭제  | O (매니저만)      | X          | X               | X                 |
| ScheduleBoard 확정            | O (매니저만)      | X          | X               | X                 |

> 매니저(=`Meeting.managerId`) 권한이 board 관련 모든 쓰기를 잠금. 멤버는 자기 schedule 만 쓸 수 있다.

### 1-3. 엔드포인트

#### FE-API-050. 내 MemberSchedule 조회

- `GET /api/v1/setlist-meetings/{meetingId}/schedules/me`
- Auth: 회의 참여자
- 200 → `MemberScheduleResponse` (없으면 빈 응답: availableDates=[], blocks={}, completed=false)

#### FE-API-051. 내 MemberSchedule upsert

- `PUT /api/v1/setlist-meetings/{meetingId}/schedules/me`
- Body: `UpsertMemberScheduleRequest { availableDates, unavailableDates, blocks, note, completed }`
  - `blocks` 는 `Map<LocalDate, String>` 으로 직렬화 (12자 hex = 48bit 압축) 권장. 또는 `Map<LocalDate, boolean[48]>` 평문.
- 200 → `MemberScheduleResponse`
- 검증: `availableDates ∩ unavailableDates = ∅`, 각 날짜는 `practiceWindow` 내, 슬롯 길이 == 48

#### FE-API-052. 회의의 모든 멤버 schedule 조회 (참여자/매니저)

- `GET /api/v1/setlist-meetings/{meetingId}/schedules`
- 200 → `List<MemberScheduleResponse>` (응답에는 userId/name/profileImg 포함)
- 용도: 가용 인원 패널 / 매트릭스 뷰 / 진행도 게이지 (`completed/total`)

#### FE-API-053. 종합(aggregate) 조회 — 30분 슬롯별 가능 멤버

- `GET /api/v1/setlist-meetings/{meetingId}/schedules/aggregate`
- Query: `from=YYYY-MM-DD&to=YYYY-MM-DD` (선택, 기본 practiceWindow)
- 200 → `List<AggregateSlotResponse> { date, startMin, endMin, availableUserIds[] }`
- 용도: Matrix view 의 heatmap, 자동 시안 생성기

> 1-3-1 ~ 1-3-3 은 server-truth 로 client 의 localStorage scheduleStore 를 대체.

#### FE-API-054. ScheduleBoard 목록 조회

- `GET /api/v1/setlist-meetings/{meetingId}/schedule-boards`
- 200 → `List<ScheduleBoardResponse>` (blocks 포함)

#### FE-API-055. ScheduleBoard 생성

- `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards`
- Auth: 매니저
- Body: `CreateScheduleBoardRequest { name, paletteSeed, blocks: ScheduleBlockInput[], constraints? }`
- 검증: 회의당 board 개수 ≤ 5, blocks 의 date 는 practiceWindow 내
- 200 → `ScheduleBoardResponse`

#### FE-API-056. ScheduleBoard 갱신 (이름/제약/일괄 블록 교체)

- `PATCH /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}`
- Body: `UpdateScheduleBoardRequest { name?, paletteSeed?, constraints?, blocks?: ScheduleBlockInput[] }`
- `blocks` 가 있으면 전체 교체(auto-reschedule 결과 반영용). 없으면 메타만 갱신.

#### FE-API-057. ScheduleBoard 삭제

- `DELETE /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}`
- Auth: 매니저. confirmed=true 인 board 는 unconfirm 후에만 삭제 가능 (또는 함께 처리).

#### FE-API-058. 단일 ScheduleBlock upsert

- `PUT /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/blocks/{blockId}`
- Body: `ScheduleBlockInput { songId, date, startSlot, durationSlots, pinned, paletteIndex, songTitleOverride?, note? }`
- 용도: 드래그-드롭 / 인라인 수정

#### FE-API-059. 단일 ScheduleBlock 삭제

- `DELETE /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/blocks/{blockId}`

#### FE-API-060. ScheduleBlock pin 토글

- `PATCH /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/blocks/{blockId}/pin`
- Body: `{ pinned: boolean }`

> 1-3-8 ~ 1-3-10 대신 1-3-6 (PATCH board with blocks 전체 교체) 만으로 충분하다고 판단되면 단일 블록 API 는 v2 에서 생략 가능. FE 는 양쪽 모두 호환.

#### FE-API-061. ScheduleBoard 확정

- `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/confirm`
- Auth: 매니저
- 동작:
  1. 같은 meetingId 의 다른 board 들은 `confirmed=false` 로 강제
  2. 대상 board 의 모든 ScheduleBlock 을 실제 `Practice` 엔티티로 일괄 생성 (트랜잭션)
     - `Practice.title` = block.songTitleOverride ?? song.title
     - `Practice.song` = mapping 된 PracticeSongId (회의가 lock 되어 practiceSongMap 이 있어야 함; 없으면 400)
     - `Practice.startAt` = block.date + slotToTime(startSlot)
     - `Practice.durationMinutes` = durationSlots × 30
     - `Practice.bandId` = meeting.bandId
     - `Practice.participants` = meeting.participantUserIds (또는 곡별 confirmed users — 정책 결정 필요, §6-3 참고)
  3. meeting 에 `scheduleBoardId` 마킹 (재확정 방지/추적)
- 200 → `ConfirmScheduleBoardResponse { boardId, confirmedAt, createdPracticeIds: string[] }`
- 에러: 409 ALREADY_CONFIRMED, 400 MEETING_NOT_LOCKED, 400 BLOCK_OUT_OF_WINDOW

#### FE-API-062. ScheduleBoard 확정 해제

- `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/unconfirm`
- 동작: confirmed=false 로 되돌리고, 생성된 Practice 들을 어떻게 처리할지 정책 결정 필요. **권고**: 생성된 Practice 는 그대로 유지, 매니저가 개별 삭제. (한번 확정 → 다른 시안 재확정 시 기존 Practice 와 충돌 가능 → §6-3 참고)

### 1-4. DTO 스케치

```kotlin
// req
data class UpsertMemberScheduleRequest(
  val availableDates: List<LocalDate>,
  val unavailableDates: List<LocalDate>,
  val blocks: Map<LocalDate, String>,  // 12자 hex (48bit) 또는 boolean[48]
  val note: String?,
  val completed: Boolean,
)

data class CreateScheduleBoardRequest(
  @field:Size(max = 50) val name: String,
  val paletteSeed: Int,
  @field:Size(max = 100) val blocks: List<ScheduleBlockInput>,
  val constraints: ScheduleBoardConstraintsInput?,
)

data class ScheduleBlockInput(
  val blockId: String?,           // null 이면 신규
  val songId: String,
  val date: LocalDate,
  @field:Min(0) @field:Max(47) val startSlot: Int,
  @field:Min(1) val durationSlots: Int,
  val pinned: Boolean = false,
  val paletteIndex: Int,
  val songTitleOverride: String?,
  @field:Size(max = 200) val note: String?,
)

// res
data class MemberScheduleResponse(
  val meetingId: String,
  val userId: Long,
  val userName: String,
  val userProfileImg: String?,
  val availableDates: List<LocalDate>,
  val unavailableDates: List<LocalDate>,
  val blocks: Map<LocalDate, String>,
  val note: String?,
  val completed: Boolean,
  val updatedAt: Instant,
)

data class ScheduleBoardResponse(
  val boardId: String,
  val meetingId: String,
  val name: String,
  val paletteSeed: Int,
  val confirmed: Boolean,
  val constraints: ScheduleBoardConstraintsResponse,
  val blocks: List<ScheduleBlockResponse>,
  val createdAt: Instant,
  val updatedAt: Instant,
)

data class AggregateSlotResponse(
  val date: LocalDate,
  val startMin: Int,
  val endMin: Int,
  val availableUserIds: List<Long>,
)
```

### 1-5. 동시성/충돌

- MemberSchedule upsert: 자기 자신만 수정 → 충돌 거의 없음. updatedAt 기반 last-write-wins.
- ScheduleBoard 단일 매니저 → 강한 동시성 거의 없음. Optimistic lock(version) 권장.
- Confirm 트랜잭션: Practice 일괄 생성은 한 트랜잭션(SERIALIZABLE 또는 advisory lock) 으로 처리. Practice.startAt 의 `@Future` 검증은 confirm 시점 기준.

### 1-6. 백엔드 측 도메인 위치 권고

- 새 모듈: `domain/schedule_coordination/` (Spring Modulith)
- 의존성: `setlist_meeting` (read), `practice` (write — Practice 일괄 생성), `band` (참여자 검증)
- API 라우트는 `setlist-meetings/{meetingId}/...` 하위로 두지만 모듈은 분리 (회의 모듈 비대화 방지). 회의 모듈은 schedule 모듈에 직접 의존하지 않음(역방향 의존 회피).

### 1-7. 미해결 정책 결정 필요 (백엔드와 합의)

- **Block 시간 충돌 정책**: 같은 board 내 동일 시간대에 두 block 허용? FE 는 현재 허용(다곡 동시 합주 표현). BE 도 충돌 금지하지 않음 권고.
- **Confirm 후 변경**: confirmed board 의 blocks 수정 가능? FE 는 unconfirm → 수정 → 재confirm 패턴. BE 는 confirmed=true 면 PATCH blocks 거부 권고(409).
- **재확정 시 기존 Practice 처리**: §1-3-13 참고. **권고**: 다른 board 로 재확정 시도 시 409 + "이전 시안 unconfirm 필요" — 실수 방지.
- **Practice 참여자 결정**: 곡별 confirmed users 만 vs 회의 전원. **권고**: 회의 전원(`meeting.participantUserIds`) 으로 일괄, 사후 매니저가 개별 Practice 에서 조정.

---

## 2. Setlist Meeting ↔ Schedule Coordination 연결 흐름

요구되는 전체 시나리오 (백엔드와 사전 합의 필요):

```
1) POST /setlist-meetings                        → 회의 생성 (purpose, performanceId?, practiceWindow)
2) POST /setlist-meetings/{m}/items               → 곡 추가
3) POST .../items/{i}/sessions/{s}/applicants     → 멤버 세션 지원
4) PATCH .../sessions/{s}/confirmations           → 매니저 세션 확정
5) POST /setlist-meetings/{m}/lock                → 곡 잠금 → PracticeSong 일괄 생성 + practiceSongMap 응답
   ─── 여기까지 API_SPEC §7 ───
6) PUT /setlist-meetings/{m}/schedules/me         → 멤버별 가용 시간 제출 (§1-3-2)
7) POST /setlist-meetings/{m}/schedule-boards     → 매니저 시간표 시안 작성 (§1-3-6)
8) POST .../schedule-boards/{b}/confirm           → 시안 확정 → Practice 일괄 생성 (§1-3-12)
9) (옵션) 공연 모드면 POST /performances/{p}/practices/batch 와 함께 호출 또는 confirm 단계에서 자동 링크
```

8. 단계의 출력은 다음 도메인의 입력으로 흐른다:

- Practice (생성)
- (purpose=performance) Performance.practices (자동 링크)

---

## 3. Setlist Meeting Phase 2 — 미해결/보강 (API_REQUIRED_2 후속)

### FE-API-063. CreateSetlistMeetingRequest 필드 보강

현재 API_SPEC §7-1 에는 `bandId, title, managerId, participantUserIds, purpose, performanceId` 만. FE Meeting 모델은 추가로 다음을 사용:

- `practiceWindow: { from: LocalDate, to: LocalDate }`
  - purpose=performance 인 경우 BE 에서 `from=today, to=performance.startAt-1d` 자동 산출 가능 → 클라가 보내지 않아도 됨
  - purpose=general 인 경우 클라 입력 필수 (마법사 step 1)
- 응답에 `practiceWindow` 포함 필수

### FE-API-064. 회의 곡 일괄 동기화 (lock 이후 추가/삭제 반영)

회의가 한번 lock 된 후 다시 unlock → 곡 추가/삭제 → 재 lock 시, BE 가 diff 를 처리해야 함 (API_REQUIRED_2 §1-3-18 와 동일).

- `POST /setlist-meetings/{m}/lock` 의 동작을 idempotent 로 정의:
  - 신규 곡 → PracticeSong 생성, practiceSongMap 추가
  - 삭제된 곡(이전 lock 에 있었으나 현재 없음) → PracticeSong 삭제 또는 detach (정책 결정)
  - 변경 곡 (제목/duration) → PracticeSong PATCH
- 응답: `{ added: [...], removed: [...], updated: [...], practiceSongMap }`

### FE-API-065. 회의 참여자 변경

- `PATCH /setlist-meetings/{m}/participants` `{ add: userId[], remove: userId[] }`
- 매니저 권한. 제거된 멤버는 자기 MemberSchedule / 세션 지원이 cascaded delete.

---

## 4. Performance 검색 응답 보강

### FE-API-066. GET /performances/search 응답에 bands.members 포함

- 현재 API_SPEC: `bands: { bandId, bandName }[]`
- FE 마법사(MeetingCreateModal)에서 공연 선택 후 그 공연의 모든 밴드의 멤버를 자동 참여자 후보로 표시
- 요구 응답 보강:
  ```json
  bands: [{
    bandId, bandName,
    members: [{ userId, name, profileImg, role }]
  }]
  ```
- 변경 위치: `searchPerformances`, `getPerformance` 두 엔드포인트 모두 통일 권고
- 대안: 별도 `GET /performances/{id}/members` 엔드포인트 (응답 가벼움). FE 는 어느 쪽이든 OK.

---

## 5. Practice-Song 마스터 검색 백엔드 보강

### FE-API-067. GET /api/v1/practice-songs/search 실데이터화

- 현재: 백엔드가 Tool 곡 고정 mock 반환 (API_SPEC §5-1)
- FE mock(`songSearchMock.ts`) 30곡으로 임시 보강중
- 옵션 A: 외부 음악 API 연동 (MusicBrainz/Spotify) — 라이선스/요청한도 검토
- 옵션 B: 내부 song 마스터 테이블 + 관리자 등록 + 사용자 자유입력 fallback
- **FE 권고**: B + "직접 입력" 분기 (현재 `POST /practice-songs` from fields 가 그 역할). 검색 성공률 무관하게 곡 등록은 가능해야 함.

---

## 6. 도메인 설계 권고

### 6-1. Spring Modulith 모듈 경계

```
backend/
├── auth
├── member
├── band
├── practice
├── practice_song
├── performance
├── setlist_meeting               # API_SPEC §7 (Phase 1) + §3 본문 추가
└── schedule_coordination         # 신규 — §1
```

의존 방향 (단방향):

- `schedule_coordination` → `setlist_meeting` (read meeting/items)
- `schedule_coordination` → `practice` (write Practice)
- `setlist_meeting` → `practice_song` (lock 시 PracticeSong 생성)
- `setlist_meeting` → `performance` (purpose=performance 일 때 link)

### 6-2. 테이블 스케치 (schedule_coordination 모듈)

```
member_schedules
  meeting_id      VARCHAR(36) NOT NULL
  user_id         BIGINT       NOT NULL
  available_dates TEXT         -- JSON: ["2026-05-02", ...]
  unavailable_dates TEXT       -- JSON
  blocks          TEXT         -- JSON: { "2026-05-02": "FFFFFFFFFFFF", ... }  (12-hex)
  note            VARCHAR(500)
  completed       BOOLEAN      NOT NULL DEFAULT FALSE
  updated_at      TIMESTAMP    NOT NULL
  PRIMARY KEY (meeting_id, user_id)
  INDEX (meeting_id)

schedule_boards
  board_id        VARCHAR(36) PRIMARY KEY
  meeting_id      VARCHAR(36) NOT NULL
  name            VARCHAR(50) NOT NULL
  palette_seed    INT          NOT NULL
  confirmed       BOOLEAN      NOT NULL DEFAULT FALSE
  working_hours_start INT      NOT NULL DEFAULT 18
  working_hours_end   INT      NOT NULL DEFAULT 44
  exclude_late_night  BOOLEAN  NOT NULL DEFAULT TRUE
  max_consecutive_minutes INT  NOT NULL DEFAULT 240
  version         BIGINT       NOT NULL DEFAULT 0   -- optimistic lock
  created_at      TIMESTAMP    NOT NULL
  updated_at      TIMESTAMP    NOT NULL
  INDEX (meeting_id)

schedule_blocks
  block_id        VARCHAR(36) PRIMARY KEY
  board_id        VARCHAR(36) NOT NULL
  song_id         VARCHAR(36) NOT NULL    -- setlist_meeting.item_id
  block_date      DATE         NOT NULL
  start_slot      SMALLINT     NOT NULL   -- 0~47
  duration_slots  SMALLINT     NOT NULL
  pinned          BOOLEAN      NOT NULL DEFAULT FALSE
  palette_index   SMALLINT     NOT NULL
  song_title_override VARCHAR(200)
  note            VARCHAR(200)
  INDEX (board_id, block_date)
  FK board_id REFERENCES schedule_boards(board_id) ON DELETE CASCADE
```

`blocks` 컬럼을 12-hex 로 압축하면 row 크기가 작고, 평문 boolean[48] 필요 시 응용 단에서 변환. PostgreSQL 사용 시 `BIT(48)` 타입 또는 `JSONB` 도 검토 가능.

### 6-3. 트랜잭션 경계 (Confirm)

`POST /schedule-boards/{boardId}/confirm` 의 트랜잭션:

1. SELECT board FOR UPDATE
2. 다른 board 들 confirmed=false 로 갱신
3. 대상 board.confirmed=true
4. 모든 block 에 대해 Practice INSERT (with practiceSongMap lookup)
5. (purpose=performance) performance_practices link insert
6. COMMIT

부분 실패 시 전체 롤백. PracticeSong 매핑 누락 시(즉 lock 안된 회의) 즉시 400 반환.

### 6-4. 권한 처리 권고

- `@PreAuthorize("@scheduleAuthService.isManager(#meetingId)")` — board 쓰기
- `@PreAuthorize("@scheduleAuthService.isParticipant(#meetingId)")` — schedule 읽기/aggregate
- `@PreAuthorize("#userId == authentication.principal.id")` — 자기 schedule 쓰기

### 6-5. 페이징/캐싱

- aggregate 응답은 비교적 무거움(7명 × 21일 × 48슬롯 ≈ 7000+ entry). 캐시: `Cache-Control: private, max-age=10` 권고. 서버 측은 DB → 메모리 집계 후 ETag 발급.
- ScheduleBoard 목록은 한 회의당 최대 5개 → 페이징 불필요.

---

## 7. FE 마이그레이션 계획 (참고)

본 문서의 BE 가 도입되면 FE 는 다음 파일을 점진적으로 교체:

| FE 파일                                                | mock → 교체 대상                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `domain/schedule-coordination/store/scheduleStore.ts`  | §1-3-1, §1-3-2 호출로 대체. 단, 입력 중간 상태(미저장 draft)는 zustand 유지 + debounce upsert. |
| `domain/schedule-coordination/store/boardStore.ts`     | §1-3-4 ~ §1-3-10 호출로 대체. Optimistic update + invalidate 패턴.                             |
| `domain/schedule-coordination/store/timetableStore.ts` | §1-3-12 응답으로 동기화.                                                                       |
| `domain/schedule-coordination/mock/scheduleSeed.ts`    | 테스트 fixture 로 격리, 런타임 import 제거.                                                    |
| `domain/setlist-meeting/store/setlistStore.ts`         | API_SPEC §7 fetcher (`api/index.ts`) 로 액션 교체.                                             |
| `domain/setlist-meeting/mock/{seed,*Mock}.ts`          | 테스트 fixture 로 격리. `performanceSearchMock` 은 §4 응답 확정 후 제거.                       |

---

## 8. 우선순위 권고

| 우선 | 항목                                                             | 사유                                    |
| ---- | ---------------------------------------------------------------- | --------------------------------------- |
| P0   | API_SPEC §7 (Setlist Meeting Phase 1) BE 구현                    | FE 핵심 흐름 잠김 해제                  |
| P0   | §1 Schedule Coordination — MemberSchedule + Aggregate (§1-3-1~3) | 서버 진실성 회복 (현재 localStorage 만) |
| P1   | §1 ScheduleBoard CRUD + Confirm (§1-3-4~13)                      | 매니저 워크플로우 완결                  |
| P1   | §3 (FE-API-063~065) Phase 2 회의 정책                            | lock/unlock/diff 정합성                 |
| P2   | §4 Performance 검색 members 보강                                 | 마법사 UX 개선, 우회 가능               |
| P2   | §5 Practice-Song 마스터 검색 실데이터화                          | 직접 입력으로 우회 가능                 |

---

## 부록 A. 참조 문서

- `API_SPEC.md` — 기 정의 엔드포인트 전체 사양
- `API_REQUIRED.md` — 1차 백엔드 요구사항 (FE-API-001~043). 이미 §7 에 흡수되었거나 deferred 상태.
- `API_REQUIRED_2.md` — Setlist Meeting Phase 2 상세
- `.taskmaster/tasks/task_010_schedule-v2.md` 등 — 진행도 게이지 등 schedule v2/v3 후속 태스크
- `src/domain/schedule-coordination/types.ts` — 본 문서의 도메인 모델 원본
- `src/domain/setlist-meeting/types.ts` — Meeting 확장 필드 (purpose/performanceId/practiceWindow/confirmedSlot 등)

## 부록 B. Mock 인벤토리 (현재 상태)

| 파일                                                                  | 도메인                | 대체 엔드포인트            | 본 문서 항목   |
| --------------------------------------------------------------------- | --------------------- | -------------------------- | -------------- |
| `setlist-meeting/mock/seed.ts`                                        | setlist-meeting       | API_SPEC §7-2/§7-3/§7-6    | (기존 스펙)    |
| `setlist-meeting/mock/memberSearchMock.ts`                            | member                | API_SPEC §2-6              | (기존 스펙)    |
| `setlist-meeting/mock/performanceSearchMock.ts`                       | performance           | API_SPEC §6 + 보강         | FE-API-066     |
| `setlist-meeting/mock/songSearchMock.ts`                              | practice-song         | API_SPEC §5-1 (실데이터화) | FE-API-067     |
| `schedule-coordination/mock/scheduleSeed.ts`                          | schedule-coordination | (신규)                     | FE-API-050~053 |
| `schedule-coordination/store/boardStore.ts` (mock 저장소)             | schedule-coordination | (신규)                     | FE-API-054~062 |
| `schedule-coordination/store/timetableStore.ts` (mock confirm 플래그) | schedule-coordination | (신규)                     | FE-API-061     |

---

끝.
