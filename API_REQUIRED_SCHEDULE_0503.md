# API_REQUIRED_SCHEDULE_0503.md

작성일: 2026-05-03
작성자: FE
대상 문서: `API_REQUIRED_0502.md` (Schedule Coordination 도메인 정의), `.taskmaster/report/api-required-resolution-2026-05-03.md` (실 BE 검증 결과)
브랜치: `feat/schedule-coordination-v2`

---

## 0. 개요

본 문서는 두 가지를 다룬다.

1. **보강/수정/추가 필요 항목** — 2026-05-03 BE Swagger + 실 호출 검증 결과 발견된 차이/결함을 우선순위별로 정리. `API_REQUIRED_0502.md` 의 후속 보완 명세로 사용.
2. **시간표 자동 생성 (Auto-Suggest) — 신규 API 설계안** — 현재 FE 클라이언트에서만 동작하는 자동 시안 생성/자동 재배치 알고리즘을 정리하고, BE 도입 두 가지 방식을 비교한 뒤 권장안과 엔드포인트 명세를 정의.

본 문서가 합의되면 `API_REQUIRED_0502.md` §1 (Schedule Coordination) 에 신규 엔드포인트 군 (FE-API-068~072) 으로 합류시킨다.

### 0-1. 검증 요약 (사전 컨텍스트)

| 도메인                                       | 현재 상태                                                        |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Schedule Coordination CRUD (FE-API-050~060)  | 구현 완료, P1 결함 2건 (블록 PUT songId 무변경 / 재 confirm 401) |
| Schedule Confirm/Unconfirm (FE-API-061·062)  | 구현 완료, 재 confirm P1 결함                                    |
| Setlist Lock idempotent diff (FE-API-064)    | `SetlistLockDiff` 구조 완료, 동작은 unlock-relock 패턴           |
| Setlist Participants (FE-API-065)            | 정상                                                             |
| Performance bands.members (FE-API-066)       | 정상                                                             |
| Practice-Song search 실데이터화 (FE-API-067) | **미해결** — 어떤 keyword 든 Tool 곡 두 곡 반환                  |
| OAuth `POST /auth/oauth/{provider}`          | **미구현**                                                       |
| **시간표 자동 생성 (본 문서 §2)**            | **API 부재 — FE 클라이언트 100% 처리**                           |

상세 재현/케이스는 `.taskmaster/report/api-required-resolution-2026-05-03.md` 참조.

---

## 1. 보강/수정/추가 필요 항목

### 1-1. P0 — 차단성 결함 (즉시 수정 필요)

#### P0-1. PUT `/schedule-boards/{boardId}/blocks/{blockId}` 의 `songId` immutability 버그

현상: 기존 blockId 에 PUT 으로 다른 `songId` 를 보내도 **응답·DB 모두 옛 값 유지**. 다른 필드(date/startSlot/durationSlots/pinned/paletteIndex/songTitleOverride/note) 는 정상 갱신.

영향: 드래그-드롭으로 블록을 다른 곡 트랙으로 이동시키는 UX silent fail. FE 가 _블록 삭제 + 신규 PUT_ 워크어라운드를 강요받음.

수정 방향:

- update 분기에서 `songId` 도 mutable 컬럼으로 처리.
- 동시에 PUT 시점에 `(meeting, songId)` 가 valid setlistItemId 인지 검증 — 현재는 임의 UUID 도 200, confirm 시점에야 `404 SETLIST_ITEM_NOT_FOUND`. 사용자 혼란 방지를 위해 검증을 PUT 으로 앞당김.

#### P0-2. POST `/schedule-boards/{boardId}/confirm` 재호출 시 `401 UNAUTHORIZED`

재현 시퀀스:

1. POST `/confirm` → 200 (Practice 1건 생성)
2. POST `/unconfirm` → 200
3. POST `/confirm` (동일 토큰, 매니저 본인) → **401 UNAUTHORIZED**

원인 추정: 이전 confirm 으로 생성된 Practice 와의 충돌(재배치 / duplicate-key) 처리 누락이 잘못된 핸들러로 라우팅되어 인증 에러로 노출.

영향: 매니저가 한번 시안을 확정한 뒤 다시 다른 시안으로 교체하는 흐름 자체가 막힘. unconfirm 후 첫 재 confirm 은 반드시 동작해야 한다.

수정 방향:

- confirm 진입 시 동일 board 의 이전 generated Practice 목록 조회 → 정책에 따라 (a) cascade 삭제 후 재생성 / (b) 전부 보존하고 추가 생성 / (c) 충돌 검사 후 명시적 `409 SCHEDULE_BOARD_RECONFIRM_REQUIRES_CLEANUP`.
- 권고: (c) — 사용자 결정 강제. 재 confirm 전에 명시적인 "이전 합주 삭제" API 호출 필요.
- 부수: 401 UNAUTHORIZED 응답 본문이 다른 401 들과 다르게 `data: null` 필드를 포함하는 점도 핸들러 매핑 점검 필요.

#### P0-3. OAuth 엔드포인트 부재 (`POST /api/v1/auth/oauth/{provider}`)

`API_REQUIRED_OAUTH_0503.md` §2-1 의 신규 엔드포인트 자체가 OpenAPI 에 없음. FE 의 카카오/구글 로그인 콜백이 토큰 교환 단계에서 100% 실패.

수정 방향: 해당 문서 §2~§4 명세 그대로 구현.

### 1-2. P1 — 기능성/사용성

#### P1-1. `MemberScheduleResponse` 멤버 식별 정보 보강

현재: `userId` 만 응답. FE 의 가용 인원 패널/매트릭스 뷰는 이름·프로필이미지가 필요해 `bands/{bandId}/members` 를 별도 호출해서 클라이언트 조인 중.

수정 방향: `userName: String`, `userProfileImg: String?` 두 필드 추가. (회의 도메인이 band 도메인을 직접 의존하지 않으려는 모듈 분리 의도가 있으면, 회의 생성/참여자 변경 시점에 스냅샷 칼럼 저장 패턴 권고.)

#### P1-2. `MemberScheduleAggregateResponse` 슬롯 단위 보강

현재: `Map<date, {available, unavailable, pending}>` — 날짜 단위 카운트만. 진행도 게이지에는 충분.

문제: FE Matrix 뷰 / 자동 시안 생성기는 **30분 슬롯별 가능 멤버 ID 리스트** 가 필요. 현재 FE 는 `GET /schedules` 응답을 받아 클라에서 `aggregateAvailability` 로 슬롯 집계 (소규모 인원 전제로 비용 무시 가능).

선택지:

- (A) 그대로 유지 — FE 에서 클라 집계. **회의 인원 ≤ 10 가정 하 권고**.
- (B) 슬롯 응답 추가 — 본 문서 §2 의 자동 생성 API 도입과 함께 묶음. 자동 생성을 BE 이전하면 BE 가 어차피 슬롯 집계가 필요하므로 같은 helper 를 노출.

본 문서 권고: §2-3 의 권장안 (자동 생성 BE 이전) 채택 시, 슬롯 집계 endpoint 도 함께 제공.

#### P1-3. `POST /schedule-boards` body 에 `blocks?: ScheduleBlockInput[]` 추가

현재: 메타(name/paletteSeed/constraints) 만 받음. FE 가 자동 시안 결과 N개 블록을 등록하려면 _보드 생성 1회 + 블록 PUT N회_ = N+1 호출.

수정 방향: body 에 `blocks?: List<ScheduleBlockInput>` 추가. 트랜잭션 1회로 처리. 본 문서 §2 의 자동 생성 API 와 동시 적용 권고.

#### P1-4. `PATCH /schedule-boards/{boardId}` body 에 `blocks?: ScheduleBlockInput[]` 추가

현재: 메타만 갱신. 자동 재배치 결과를 일괄 반영하려면 블록별 PUT/DELETE 시퀀스 필요.

수정 방향: body 에 `blocks?` (전체 교체 시멘틱) 또는 `blockOps?: { upsert?: [...], delete?: [blockId, ...] }` (델타 시멘틱) 추가. 권고는 단순한 전체 교체 (FE 가 board 전체 상태를 보내면 BE 가 diff 적용).

#### P1-5. `practice-songs/search` 실데이터화 (FE-API-067 미해결 유지)

현재: 어떤 keyword 든 Tool 두 곡 반환. 또한 Swagger 파라미터명 `query` 와 실제 동작 `keyword` 불일치.

권고: `API_REQUIRED_0502.md` §5 옵션 B (내부 song 마스터 + 자유입력 fallback). 단기적으로는 FE 의 30곡 mock + 직접 입력 분기로 우회 — BE 작업 우선순위는 P1 후순위.

### 1-3. P2 — 정합성/스펙

#### P2-1. `memberId` 쿼리 파라미터 redundant 제거

현재: 거의 모든 인증 필요 endpoint 가 `?memberId={long}` 을 required query 로 강제. 그러나 `PUT /schedules/me?memberId=4` 를 JWT subject=5 로 호출 시 BE 가 query 의 4 를 무시하고 user 5 로 동작 → JWT 가 source of truth, query 는 redundant.

수정 방향: 모든 `memberId` query 제거 또는 optional. JWT subject 단일화. FE 보일러플레이트 감소 + 영구 잠재 보안 혼동 제거.

#### P2-2. PUT 응답 stale `updatedAt`

`PUT /schedules/me` 응답의 `updatedAt` 이 직전 PUT 시점 timestamp 로 노출. 다음 GET 호출 시에는 정상값. 트랜잭션 commit 전 직렬화 의심.

수정 방향: PUT 응답 직전에 entity refresh.

#### P2-3. Practice `sessions` propagation

confirm 시 생성되는 Practice 의 `sessions` 가 비어 있음. SetlistItem 의 sessions 정의(`{sessionId, label, short, need}`) 를 Practice 에 자동 복사할지 여부 정책 결정 필요. 현재 FE 는 confirm 후 별도 `POST /practices/{id}/sessions` 호출 부담.

권고: confirm 시 자동 복사. 사용자가 수동 추가하던 작업을 줄임.

#### P2-4. Swagger 문서 ↔ 구현 mismatch

`practice-songs/search` 의 파라미터명 (`query` 표기 vs 실제 `keyword`). 다른 endpoint 도 sweep 필요.

---

## 2. 신규 — 시간표 자동 생성 (Auto-Suggest) API

### 2-1. 현재 FE 측 알고리즘

FE 는 두 종류의 자동화를 클라이언트에서 수행한다.

#### A. 자동 시안 생성 — `suggestScheduleBoards`

파일: `src/domain/schedule-coordination/utils/autoSuggest.ts`

입력:

- `schedules: MemberSchedule[]` — 모든 멤버의 가용 시간
- `dates: string[]` — 합주 가능 일자 목록 (`practiceWindow` 펼침)
- `songs: { id, title }[]` — 회의 잠금 후 곡 목록
- `blockDurationSlots`: 곡당 기본 길이 슬롯 (default 4 = 2시간)
- `variantCount`: 변형 시안 개수 (default 3)
- `minMembers`: 최소 동시 가능 인원 (default 2)

알고리즘:

1. `aggregateAvailability(schedules, dates)` — 날짜·슬롯별 동시 가능 인원수 매트릭스 계산.
2. `rankSlots(aggregate, minMembers)` — 가능 인원 ≥ minMembers 인 슬롯들을 (count desc, date asc, slot asc) 로 정렬한 ranked 리스트.
3. variant 별 (`v = 0..variantCount-1`):
   - 곡 목록을 v 만큼 회전 (`rotate(songs, v)`) — 변형 간 시작 곡 분산.
   - 각 곡에 대해 ranked 에서 위에서부터 _점유되지 않은 연속 `blockDurationSlots` 슬롯_ 을 찾아 배치.
   - 점유 표시는 `${date}__${slot}` 키 set.
   - 자리 못 찾으면 해당 variant 는 부분 배치 상태로 종료.

출력: `BoardVariant[]` 각각 `blocks: Omit<ScheduleBlock, 'pinned' | 'paletteIndex'>[]`.

특성:

- **결정성** — 동일 입력 동일 출력 (deterministic, 시드는 variant index 회전).
- **단순 greedy** — 충돌 회피만 처리. 곡당 정확히 한 슬롯에 배치 (반복 합주 없음).
- **constraints 미반영** — workingHours / excludeLateNight / maxConsecutiveMinutes 는 자동 시안에서 미적용. 자동 시안 후 사용자가 수동 조정 또는 §B 의 재배치로 정리.

#### B. 자동 재배치 — `autoRescheduleAfterMove`

파일: `src/domain/schedule-coordination/utils/autoReschedule.ts`

입력:

- `blocks: ScheduleBlock[]` — 보드의 현재 블록들
- `anchorBlockId: string` — 사용자가 막 옮긴(앵커) 블록 — 고정
- `constraints: ScheduleBoardConstraints` — workingHours / excludeLateNight 등
- `availableDates: string[]` — 재배치 가능 일자

알고리즘 (BFS cascade):

1. anchor 가 constraints 적합한지 체크 — 부적합이면 null 반환 (사용자에게 "이동 불가" 안내).
2. anchor 를 placedRanges 에 등록.
3. queue 에 anchor 만 넣고 BFS:
   - head 와 겹치는 다른 블록 each:
     - `pinned` 면 null 반환 (사용자에게 "고정 블록과 충돌" 안내).
     - 아니면 `findFreeSlot(other.blockId, durationSlots, origin=other 원래 위치)` 로 새 자리 탐색:
       - origin 일자에서 origin 슬롯부터 forward → origin 이후 일자 → origin 이전 일자 (wrap) 순.
       - constraints 위반 슬롯/이미 점유 슬롯 skip.
     - 이동 후 queue 에 추가.
4. queue 비면 result 반환.

특성:

- **constraints 준수** — workingHours / excludeLateNight 적용.
- **pinned 존중** — 핀 충돌 시 전체 무효화.
- **부드러운 이동** — origin 근처 우선 탐색.
- **maxConsecutiveMinutes 미반영** (현재 FE 알고리즘 한계).

#### C. 보조 유틸 — `copyWeekBlocks`

주별 블록 복제. 본 문서 자동 생성 범위와는 별개의 사용자 명령. (BE 이전 시 같은 modulith 내 helper 로 둠)

### 2-2. BE 도입 두 가지 방식

#### 방식 A. 알고리즘 자체 BE 이전 (FE 는 호출만)

BE 가 schedule + 곡 + constraints 를 입력으로 받아 variant 후보들을 계산하고, 그 결과를 새 ScheduleBoard(s) 로 영속화.

장점:

- **FE 가벼워짐** — 자동 생성 로직 중복 제거. 무거운 회의(인원 많음/곡 많음) 에서 클라 CPU 부담 제거.
- **결정성/감사 용이** — 같은 시안이 어디서 생성되었는지 BE 로그로 추적.
- **다른 클라이언트 호환성** — 앞으로 모바일 네이티브 등 다른 클라가 붙어도 동일 결과.
- **슬롯 집계와 자연 통합** — BE 가 이미 schedule 정보를 보유. FE 가 schedule 다 받아서 다시 보낼 필요 없음.
- **트랜잭션 단위 명확** — variant N개 생성을 한 트랜잭션으로 처리. 부분 실패 없음.

단점:

- **BE 작업 비용** — 알고리즘 포팅 + 테스트.
- **구현 차이 위험** — Kotlin 포팅 시 미묘한 결정성 차이 — 골든 테스트 필요.

#### 방식 B. Bulk 등록만 보강 (알고리즘 FE 유지)

FE 가 계산하고 결과 블록 N개를 한번에 보낼 수 있도록 `POST /schedule-boards` 와 `PATCH /schedule-boards/{id}` body 에 `blocks[]` 를 추가만.

장점:

- **저비용 BE 변경** — 기존 endpoint 시그니처 보강만.
- **FE 알고리즘 유지** — 검증된 코드 재사용.

단점:

- **알고리즘 중복 위험** — 향후 다른 클라이언트도 같은 알고리즘 다시 구현해야 함.
- **클라 CPU 부담** — 인원/곡 증가 시 brower 멈춤 위험. (현실적으로 유저 ≤ 10, 곡 ≤ 30 이면 무시 가능)
- **결정성/감사 어려움** — 누가 어떤 시안을 만들었는지 BE 가 알기 어려움.

### 2-3. 권장안 — **방식 A (BE 이전) + 방식 B (bulk 등록) 병행**

이유:

- 자동 생성은 BE 가 담당 (감사·결정성·향후 클라 호환).
- bulk 블록 등록 은 _자동 생성과 무관하게 사용자 수동 조정 후 일괄 저장_ UX 에서도 유용.
- 자동 재배치 (`autoRescheduleAfterMove`) 는 사용자 인터랙션과 즉각성이 중요하므로 **FE 클라이언트에서 유지**. 단 결과를 한번에 저장할 때 bulk 등록 사용.

→ 즉:

- 신규 endpoint **POST `/schedule-boards/auto-suggest`** (자동 시안 생성, BE 알고리즘)
- 기존 endpoint 보강 **POST `/schedule-boards`** body 에 `blocks?[]` 추가 (FE-API-068)
- 기존 endpoint 보강 **PATCH `/schedule-boards/{boardId}`** body 에 `blocks?[]` 추가 (FE-API-069)
- 보조 endpoint **GET `/schedules/slot-aggregate`** (슬롯 단위 집계 — FE 매트릭스 뷰 + 향후 다른 클라용)

### 2-4. 신규 엔드포인트 명세

#### FE-API-068. POST `/schedule-boards` body 에 `blocks?` 추가

- Path: `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards`
- Auth: 매니저
- Body 보강:

  ```kotlin
  data class ScheduleBoardCreateRequest(
    @field:Size(max = 50) val name: String,
    val paletteSeed: Int,
    val constraints: ScheduleBoardConstraintsDto?,
    @field:Size(max = 100) val blocks: List<ScheduleBlockInput>? = null,  // NEW
  )

  data class ScheduleBlockInput(
    val blockId: String? = null,         // null 이면 신규(서버가 UUID 생성)
    val songId: String,
    val date: LocalDate,
    @field:Min(0) @field:Max(47) val startSlot: Int,
    @field:Min(1) val durationSlots: Int,
    val pinned: Boolean = false,
    val paletteIndex: Int,
    val songTitleOverride: String? = null,
    @field:Size(max = 200) val note: String? = null,
  )
  ```

- 동작: 보드 생성 + (blocks 가 있으면) 블록 일괄 INSERT 한 트랜잭션.
- 검증:
  - 회의당 보드 ≤ 5
  - 각 block 의 `(date, startSlot..startSlot+durationSlots)` 가 working bounds (`startSlot+durationSlots ≤ 48`) 내
  - 각 block 의 date 가 회의의 `practiceWindow.from..to` 내
  - 각 block 의 `songId` 가 해당 meetingId 의 setlistItemId 인지 검증
- 응답: 기존 `ScheduleBoardResponse` (blocks 포함)

#### FE-API-069. PATCH `/schedule-boards/{boardId}` body 에 `blocks?` 추가

- Path: `PATCH /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}`
- Auth: 매니저
- Body 보강:
  ```kotlin
  data class ScheduleBoardUpdateRequest(
    @field:Size(max = 50) val name: String? = null,
    val paletteSeed: Int? = null,
    val constraints: ScheduleBoardConstraintsDto? = null,
    val blocks: List<ScheduleBlockInput>? = null,   // NEW — 전체 교체 시멘틱
    val expectedVersion: Long? = null,                // NEW — 낙관적 락 체크용 (선택)
  )
  ```
- 동작:
  - `blocks` 가 있으면: 기존 블록 전부 제거 + 새 blocks 일괄 INSERT (한 트랜잭션). 자동 재배치 결과 반영용.
  - `blocks` 가 없으면: 메타(name/paletteSeed/constraints) 만 갱신.
  - confirmed 보드는 거부 (`409 SCHEDULE_BOARD_ALREADY_CONFIRMED`) — 기존 정책 유지.
  - `expectedVersion` 이 주어지면 board.version 과 비교, 불일치 시 `409 OPTIMISTIC_LOCK_CONFLICT` (FE 가 stale 상태로 덮어쓰는 사고 방지).
- 검증: FE-API-068 과 동일.
- 응답: `ScheduleBoardResponse`.

#### FE-API-070. POST `/schedule-boards/auto-suggest` (신규 — 자동 시안 생성)

- Path: `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards/auto-suggest`
- Auth: 매니저
- 전제: 회의가 lock 된 상태 (setlistItem 확정). lock 안 된 상태면 `400 MEETING_NOT_LOCKED`.
- Request:

  ```kotlin
  data class ScheduleBoardAutoSuggestRequest(
    /** 곡당 기본 길이 (슬롯, 30분=1). default 4. */
    @field:Min(1) @field:Max(24) val blockDurationSlots: Int = 4,
    /** 변형 시안 개수. default 3, max 5. */
    @field:Min(1) @field:Max(5) val variantCount: Int = 3,
    /** 슬롯당 최소 동시 가능 인원. default 2. */
    @field:Min(1) val minMembers: Int = 2,
    /** 시안에 적용할 constraints — 미지정 시 DEFAULT_BOARD_CONSTRAINTS 사용. */
    val constraints: ScheduleBoardConstraintsDto? = null,
    /** variant 명명 prefix. default "자동 시안". 응답 보드 name = "{prefix} {1..N}". */
    @field:Size(max = 30) val namePrefix: String? = null,
    /** 영속화 정책. default PERSIST_ALL. */
    val persistMode: AutoSuggestPersistMode = AutoSuggestPersistMode.PERSIST_ALL,
  )

  enum class AutoSuggestPersistMode {
    /** 모든 variant 를 보드로 저장. 회의의 보드 ≤ 5 한도 검사. */
    PERSIST_ALL,
    /** 어느 variant 도 저장하지 않고 결과만 응답 (preview). FE 가 사용자 선택 후 별도 POST 로 저장. */
    PREVIEW_ONLY,
  }
  ```

- Response:

  ```kotlin
  data class ScheduleBoardAutoSuggestResponse(
    val variants: List<ScheduleBoardVariant>,
    /** PERSIST_ALL 인 경우 생성된 boardId 목록. PREVIEW_ONLY 면 빈 배열. */
    val createdBoardIds: List<UUID>,
    /** 알고리즘이 사용한 슬롯 집계 메타 (디버깅/트랜스페어런시). */
    val meta: AutoSuggestMeta,
  )

  data class ScheduleBoardVariant(
    /** PERSIST_ALL 이면 보드 응답 그대로. PREVIEW_ONLY 면 보드는 미생성 — boardId/version null. */
    val name: String,
    val paletteSeed: Int,
    val blocks: List<ScheduleBlockResponse>,
    val boardId: UUID? = null,
    val version: Long? = null,
    /** 곡 중 자리를 못 찾아 누락된 항목. */
    val unplacedSongIds: List<UUID> = emptyList(),
  )

  data class AutoSuggestMeta(
    /** 슬롯 집계 시점에서 minMembers 이상 충족하는 슬롯 개수. */
    val candidateSlotCount: Int,
    /** 알고리즘 결정성 시드 (FE 회전 인덱스 등). */
    val seed: Int,
    /** Total 곡 수 vs 배치된 평균. */
    val totalSongs: Int,
    val avgPlacedPerVariant: Double,
  )
  ```

- 동작:
  1. meeting lock 확인.
  2. meeting 의 모든 멤버 schedule 조회 + 슬롯 집계.
  3. setlistItem 목록 조회 (= 자동 배치 대상 곡).
  4. variant N 개 생성 (FE `suggestScheduleBoards` 와 동일 알고리즘 — 결정성 보장).
  5. `persistMode == PERSIST_ALL` 이면:
     - 회의 현재 보드 수 + N ≤ 5 검증 (`400 SCHEDULE_BOARD_LIMIT_EXCEEDED_BY_AUTO_SUGGEST`)
     - 각 variant 를 ScheduleBoard 로 저장 (한 트랜잭션). 보드명: `{namePrefix ?: "자동 시안"} {1..N}`.
     - constraints 적용 (request → DEFAULT 폴백).
  6. PREVIEW_ONLY 면 응답만 구성 후 종료.

- 에러:
  - `400 MEETING_NOT_LOCKED` — 회의 lock 안 됨
  - `400 NO_AVAILABLE_SLOTS` — minMembers 충족 슬롯 0개 (즉 빈 시안만 가능)
  - `400 NO_SETLIST_ITEMS` — 곡 0개
  - `400 SCHEDULE_BOARD_LIMIT_EXCEEDED_BY_AUTO_SUGGEST` — PERSIST_ALL 시 한도 초과
  - `403 SETLIST_MEETING_NOT_MANAGER` — 매니저 아님

- 결정성: 동일 (schedule snapshot, items, request) 입력은 동일 variant 결과 (감사/회귀 테스트 가능).

#### FE-API-071. GET `/schedules/slot-aggregate` (신규 — 슬롯 단위 집계)

- Path: `GET /api/v1/setlist-meetings/{meetingId}/schedules/slot-aggregate`
- Auth: 회의 참여자
- Query: `from=YYYY-MM-DD&to=YYYY-MM-DD` (선택, 기본 practiceWindow)
- Response:

  ```kotlin
  data class SlotAggregateResponse(
    /** date → 48-slot count 배열 (가능 인원수). */
    val counts: Map<LocalDate, IntArray>,
    /** date → slot → 가능 멤버 userId 리스트. heatmap 호버 정보. */
    val availableUserIds: Map<LocalDate, Map<Int, List<Long>>>,
    val totalParticipants: Int,
  )
  ```

- 사용처:
  - FE Matrix view heatmap (날짜·슬롯별 색상 강도 + 호버 시 가능 멤버 표시)
  - 향후 BE auto-suggest 의 트랜스페어런시 (어떤 슬롯이 후보였는지)

- 응답 캐시: `Cache-Control: private, max-age=10` 권고. ETag 발급.

- 비고: 기존 `GET /schedules/aggregate` (날짜 단위 카운트) 는 진행도 게이지용으로 별도 유지. 슬롯 집계는 응답이 무거워 별 endpoint 로 분리.

#### FE-API-072. (확장) POST `/schedule-boards/{boardId}/auto-rebalance`

선택사항. 자동 재배치 (`autoRescheduleAfterMove`) 를 BE 로 옮기는 옵션. 본 문서 권고는 **FE 유지** 이지만, 향후 모바일 클라/장기적 결정성 강화 시 도입 후보.

- Path: `POST /api/v1/setlist-meetings/{meetingId}/schedule-boards/{boardId}/auto-rebalance`
- Auth: 매니저
- Request:
  ```kotlin
  data class ScheduleBoardAutoRebalanceRequest(
    /** 사용자가 막 옮긴 블록 — 이 블록 위치는 고정. */
    val anchorBlockId: UUID,
    /** anchor 의 새 위치 (date/startSlot/durationSlots) — 클라가 이미 저장 안 한 경우 같이 보냄. */
    val anchorPlacement: ScheduleBlockInput? = null,
    val expectedVersion: Long? = null,
  )
  ```
- Response: 갱신된 `ScheduleBoardResponse`.
- 에러: `409 SCHEDULE_BOARD_REBALANCE_PINNED_CONFLICT`, `409 SCHEDULE_BOARD_REBALANCE_NO_FIT`.

> 본 문서는 FE-API-072 를 **deferred** 로 둠. P3 이하.

### 2-5. 도메인 설계 보강 (`schedule_coordination` 모듈)

`API_REQUIRED_0502.md` §6 의 schedule_coordination 모듈에 다음을 추가:

#### 신규 서비스

- `ScheduleAutoSuggestService` — variant 생성 알고리즘. 순수 함수 권고 (입력: schedules + items + request → 출력: variants). 트랜잭션 외부에서 계산.
- 영속화는 기존 `ScheduleBoardService` 가 담당 (variant 결과를 `createBoardWithBlocks` 로 위임).

#### 신규/보강 엔티티

- `ScheduleBoard` 에 `auto_suggest_seed: Int?` 컬럼 추가 — 어떤 자동 시안에서 파생되었는지 트래킹 (수동 생성이면 null).
- `ScheduleBoard` 에 `created_by: Long` 칼럼 추가 — 매니저 변경 시나리오 대비.

#### 결정성 골든 테스트

- `ScheduleAutoSuggestServiceTest` 가 fixed schedules + items + request 에 대해 fixed variants 를 만드는지 검증. FE `suggestScheduleBoards` 의 출력과 동일한지 fixture 비교 — 알고리즘 drift 방지.

#### 트랜잭션 경계

- POST /auto-suggest (PERSIST_ALL):
  1. SELECT meeting FOR UPDATE
  2. lockedAt != null 확인
  3. SELECT existing boards (count)
  4. 알고리즘 실행 (트랜잭션 안에서 read-only)
  5. INSERT N boards + INSERT N×M blocks
  6. COMMIT

#### 권한

- 기존 `@PreAuthorize("@scheduleAuthService.isManager(#meetingId)")` 재사용.

### 2-6. FE 측 변경 영향

| 파일                                                                       | 변경                                                                                                                                                                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/schedule-coordination/utils/autoSuggest.ts`                    | BE 도입 후 **삭제 또는 dev-only 보존**. 호출 측은 `POST /schedule-boards/auto-suggest` 로 교체. 알고리즘 자체는 결정성 검증을 위해 한동안 dev mode 에서 비교 검증용으로 보존 가능. |
| `src/domain/schedule-coordination/utils/autoReschedule.ts`                 | **유지**. FE 즉각성 인터랙션 담당. 결과 저장은 PATCH `/schedule-boards/{id}` (FE-API-069) 의 blocks 일괄 교체로.                                                                   |
| `src/domain/schedule-coordination/store/boardStore.ts`                     | mock 액션을 실 API 호출로 교체. 자동 재배치 후에는 PATCH 한번만 호출.                                                                                                              |
| `src/domain/schedule-coordination/components/ScheduleBoardList.client.tsx` | "자동 추천" 버튼 onClick 이 BE auto-suggest 호출 → 응답 받은 보드 목록을 store 갱신.                                                                                               |
| `src/domain/schedule-coordination/hooks/`                                  | `useAutoSuggestBoards()` mutation 신규. `usePatchScheduleBoard()` 가 blocks 일괄 교체 지원.                                                                                        |

마이그레이션 순서 권고:

1. P0 결함 (P0-1, P0-2) BE 수정
2. FE-API-068·069 (bulk 블록) 도입 — FE 가 자동 재배치 결과를 1회 호출로 저장 가능
3. FE-API-070 (auto-suggest) + FE-API-071 (slot-aggregate) 동시 도입
4. FE 가 mock store → 실 API 로 단계적 교체
5. (옵션) FE-API-072 도입 검토

---

## 3. 우선순위 매트릭스

| 우선 | 항목                               | 분류             | 비고                       |
| ---- | ---------------------------------- | ---------------- | -------------------------- |
| P0   | P0-1 PUT block songId immutability | 기존 결함 수정   | 드래그-드롭 차단 해제      |
| P0   | P0-2 재 confirm 401                | 기존 결함 수정   | 시안 교체 흐름 차단 해제   |
| P0   | P0-3 OAuth endpoint 신규           | 신규 (별도 문서) | API_REQUIRED_OAUTH_0503 §2 |
| P1   | FE-API-068 POST board with blocks  | 신규 보강        | 자동 시안 영속화 비용 ↓    |
| P1   | FE-API-069 PATCH board with blocks | 신규 보강        | 자동 재배치 영속화 비용 ↓  |
| P1   | FE-API-070 POST /auto-suggest      | 신규             | BE 자동 시안 (방식 A 권장) |
| P1   | FE-API-071 GET /slot-aggregate     | 신규             | 슬롯 집계 endpoint         |
| P1   | P1-1 MemberSchedule 멤버정보 보강  | 응답 보강        | userName/profileImg        |
| P1   | P1-5 song search 실데이터화        | 기존 결함        | 30곡 mock 우회 가능        |
| P2   | P2-1 memberId query 제거           | 정리             | 보일러플레이트 ↓           |
| P2   | P2-2 PUT updatedAt staleness       | 정리             | 캐시 정합성                |
| P2   | P2-3 Practice sessions 자동 복사   | 정책 결정        | confirm UX 개선            |
| P2   | P2-4 Swagger ↔ 구현 sweep          | 정리             | 신뢰성                     |
| P3   | FE-API-072 POST /auto-rebalance    | 향후 검토        | 모바일/멀티 클라 도입 시   |

---

## 4. 참조 문서

- `API_REQUIRED_0502.md` — Schedule Coordination 도메인 정의 (FE-API-050~062), Setlist Phase 2 보강 (FE-API-063~065), Performance/Song 보강 (FE-API-066·067)
- `API_REQUIRED_OAUTH_0503.md` — OAuth 엔드포인트 명세
- `.taskmaster/report/api-required-resolution-2026-05-03.md` — 본 문서의 검증 근거 리포트 (재현 시퀀스 포함)
- `src/domain/schedule-coordination/utils/autoSuggest.ts` — 본 문서 §2-1-A 알고리즘 원본
- `src/domain/schedule-coordination/utils/autoReschedule.ts` — 본 문서 §2-1-B 알고리즘 원본
- `src/domain/schedule-coordination/utils.ts` — `aggregateAvailability`, `slotToTime` 등 helper

---

끝.
