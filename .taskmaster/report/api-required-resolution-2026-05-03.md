# API_REQUIRED 해소 여부 검증 리포트 (2026-05-03)

## 메타

- 작성일: 2026-05-03
- 작성자: FE (verification by Claude Code, 사용자 sunwoo)
- 대상 BE: `http://localhost:8080` (Swagger `/swagger-ui/index.html`, OpenAPI `/api-docs`)
- 대상 FE 문서:
  - `bandage-fe/API_REQUIRED_0502.md` — Schedule Coordination 신규 + Setlist Phase 2 보강 + 부수 보강 (FE-API-050~067)
  - `bandage-fe/API_REQUIRED_OAUTH_0503.md` — Kakao/Google OAuth 로그인 (POST /api/v1/auth/oauth/{provider})
- 검증 도구: curl + jq + python (수동)
- 범위: API_REQUIRED 두 문서가 BE Swagger 에 반영되었는지(스펙 일치) + 실제 호출이 동작하는지(런타임 일치) + Mock → 실 API 대체 가능 여부

---

## 0. 한 줄 요약

- Schedule Coordination 신규 도메인(FE-API-050~062)과 Setlist Phase 2 보강(FE-API-063·065), Performance 응답 보강(FE-API-066) 은 **백엔드 구현 완료**. 단 일부 응답 스키마와 Aggregate 형식이 FE 사양과 다르며, 블록 PUT 의 `songId` 무변경/재confirm 시 401 등 **차단성 결함 2건** 존재.
- Practice-Song 마스터 검색(FE-API-067) 과 OAuth 엔드포인트(API_REQUIRED_OAUTH_0503 §2-1) 는 **미구현** — Mock 대체 불가.
- Setlist 락 idempotent diff(FE-API-064) 는 응답 구조(`SetlistLockDiff added/updated/removed`)는 반영되었으나, 동작은 _idempotent re-lock_ 이 아니라 **`unlock → 변경 → 재 lock`** 패턴(재호출 시 `409 SETLIST_MEETING_LOCKED`)임. FE 가 unlock-relock 패턴으로 맞추면 사용 가능.

---

## 1. 항목별 결론 (FE-API ID 기준)

| ID | 항목 | Swagger 반영 | 런타임 검증 | Mock 대체 | 비고 |
|---|---|---|---|---|---|
| FE-API-050 | GET /schedules/me | 완료 | 정상 | 가능 | 스키마: `userId/availableDates/unavailableDates/blocks/note/completed/updatedAt` — `meetingId` 필드 없음(경로에 있음). 응답 P1: PUT 직후 응답 `updatedAt` 이 신값이 아닌 **이전값** 반환(GET 시에는 갱신됨) |
| FE-API-051 | PUT /schedules/me | 완료 | 정상 | 가능 | `blocks` 는 `Map<date, "12-hex">` 평문 문자열로 저장/응답. FE 권고와 일치. JWT 주체로 동작(쿼리 `memberId` 무시되며 사용자 본인 schedule 만 갱신) |
| FE-API-052 | GET /schedules | 완료 | 정상 | **부분** | 스펙: `MemberScheduleResponse` 에 `userName/userProfileImg` 없음 (`userId` 만). FE 가용 인원 패널/매트릭스에서 이름 표시하려면 별도 멤버 조회(`GET /api/v1/bands/{bandId}/members` 또는 `members/search`)와 클라 조인 필요. Backend 응답 보강 권고 |
| FE-API-053 | GET /schedules/aggregate | **다른 형태** | 정상 | **불가** | FE 사양: `List<AggregateSlotResponse> { date, startMin, endMin, availableUserIds[] }` (30분 슬롯별 가능 멤버 ID 리스트). BE 구현: `MemberScheduleAggregateResponse { dateAvailability: Map<date, {available, unavailable, pending}>, totalParticipants, completedCount }` (날짜 단위 집계 카운트만). **결론**: 진행도 게이지 / 날짜별 점유율 표시는 OK. 시간 슬롯 heatmap·자동 시안 생성기에는 데이터 부족. FE 가 `GET /schedules` 응답을 받아 클라이언트에서 슬롯 집계하거나, BE 가 슬롯 집계 별도 엔드포인트 추가 필요 |
| FE-API-054 | GET /schedule-boards | 완료 | 정상 | 가능 | `version` 필드 포함(낙관적 락). `updatedAt` 필드 부재(보드 단위) — 필요 시 보강 |
| FE-API-055 | POST /schedule-boards | **차이** | 정상 | **부분** | 요청 스키마에 `blocks: ScheduleBlockInput[]` 없음. **boards 생성 시 블록 일괄 등록 불가** — 빈 보드 생성 후 블록 별도 PUT 필요. 자동 시안 생성 결과 반영 시 N+1 호출. 한도 검증 OK (5개 초과 시 `400 SCHEDULE_BOARD_LIMIT_EXCEEDED`). 매니저 권한 검증 OK |
| FE-API-056 | PATCH /schedule-boards/{id} | **차이** | (미테스트) | **부분** | 요청 스키마에 `blocks` 없음 — 메타(name/paletteSeed/constraints) 만 갱신. 일괄 블록 교체 불가. 자동 재배치 결과 반영 시 블록별 PUT/DELETE 호출 필요 |
| FE-API-057 | DELETE /schedule-boards/{id} | 완료 | (확인) | 가능 | confirmed 보드 삭제 정책은 미테스트 (현재는 confirm 후 unconfirm 가능, 이후 삭제 가능 추정) |
| FE-API-058 | PUT block | 완료 | **버그 P1** | **부분** | 정상: 신규 블록 생성 OK, 메타(date/startSlot/durationSlots/pinned/paletteIndex/songTitleOverride/note) 갱신 OK. **결함**: 기존 blockId 의 PUT 시 요청 `songId` 가 무시되고 응답에 옛 값 반환 (재현 §3-A). 또한 `songId` 가 setlist item 으로 검증되지 않아 임의 UUID 도 200 — confirm 단계에서야 `404 SETLIST_ITEM_NOT_FOUND` 발생 |
| FE-API-059 | DELETE block | 완료 | 정상 | 가능 | |
| FE-API-060 | PATCH block pin | 완료 | 정상 | 가능 | confirmed 보드의 pin 변경은 `409 SCHEDULE_BOARD_ALREADY_CONFIRMED` (정책 의도와 일치) |
| FE-API-061 | POST /confirm | 완료 | **버그 P1** | **부분** | 첫 confirm 정상: Practice 일괄 생성, `participants = meeting.participantUserIds`, `startAt = date + slotToTime(startSlot)`, `durationMinutes = durationSlots × 30`. **결함**: unconfirm 후 동일 보드 재 confirm 시 `401 UNAUTHORIZED` (다른 endpoint 는 동일 토큰으로 정상). 이전 생성 Practice 와의 충돌 처리 누락이 잘못된 에러 코드로 노출됨 (재현 §3-B). 또한 응답에 createdPracticeIds 가 아니라 `practicesCreated: PracticeCreatedSummary[]` 형식 (필드명 차이) |
| FE-API-062 | POST /unconfirm | 완료 | 정상 | 가능 | confirmed=false 로 되돌림. 기존 Practice 는 그대로 유지(권고대로) |
| FE-API-063 | CreateSetlistMeeting practiceWindow | 완료 | 정상 | 가능 | `purpose=PERFORMANCE` + practiceWindow 미전송 시 BE 가 `today ~ performance.startAt-1d` 자동 산출. `purpose=GENERAL` 은 클라 입력 필수. `SetlistMeetingResponse` 에 `practiceWindow` 포함 |
| FE-API-064 | Lock idempotent diff | **부분** | (정상이지만 흐름 다름) | 가능(흐름 변경 필요) | `SetlistLockResponse` 에 `diff: { added, updated, removed }` 포함. 그러나 _재호출_ 은 `409 SETLIST_MEETING_LOCKED` — **idempotent 가 아님**. FE 는 lock → unlock → 곡 변경 → 재 lock 패턴으로 변경 필요. 재 lock 시 변경 내역이 diff 로 반환되는지는 별도 시나리오 미테스트 |
| FE-API-065 | PATCH participants | 완료 | 정상 | 가능 | `{add, remove}` body. 응답은 `SetlistMeetingDetailResponse` (participantUserIds 포함). 제거된 멤버의 schedule cascaded 처리 여부는 미테스트 |
| FE-API-066 | Performance bands.members | 완료 | 정상 | 가능 | `PerformanceBandSummary.members: PerformanceBandMemberSummary[]` — `userId/name/profileImg/role` 포함. `searchPerformances` 와 `getPerformance` 양쪽 모두 응답에 포함 |
| FE-API-067 | practice-songs/search realdata | **미해결** | 동일한 Tool 곡 mock 반환 | 불가 | 어떤 keyword 입력에도 `[Vicarious, Schism]` (Tool) 두 곡만 반환. 또한 Swagger 파라미터명이 `query` 라고 표기되어 있으나 실제 동작은 `keyword` (Swagger 문서 ↔ 구현 mismatch) |
| OAuth (API_REQUIRED_OAUTH §2-1) | POST /api/v1/auth/oauth/{provider} | **미구현** | 401 (auth 필터에 가로막힘 — 라우트 자체 부재) | 불가 | `/v3/api-docs` 에 `/auth/oauth/*` 경로 자체 없음 |

요약:
- **완전 해소(즉시 mock 대체 가능)**: FE-API-050, 051, 054, 057, 059, 060, 062, 063, 065, 066 (10건)
- **부분 해소(스키마 갭으로 FE 추가 작업 필요)**: FE-API-052, 053, 055, 056, 058, 061, 064 (7건)
- **미해결(Mock 유지 필수)**: FE-API-067, OAuth (2건)

---

## 2. 도메인별 Mock 대체 가능 여부

### 2-1. `src/domain/schedule-coordination/` — **부분 대체 가능**

| 파일 | 대체 대상 | 가능 여부 | 비고 |
|---|---|---|---|
| `store/scheduleStore.ts` | FE-API-050~053 | 가능 (단 §2-1-a 주의) | `aggregate` 형식 차이 → 슬롯 단위 집계는 클라에서 `GET /schedules` 데이터로 재계산 |
| `store/boardStore.ts` | FE-API-054~060 | 가능 (단 §2-1-b) | 일괄 블록 등록 불가 → 보드 생성 후 블록 별도 호출 N회. 자동 재배치 시 기존 블록 DELETE + 신규 PUT 시퀀스 필요 |
| `store/timetableStore.ts` | FE-API-061·062 | 가능 (단 P1 버그 §3-B) | 첫 confirm OK, 재 confirm 결함 — FE 사용 흐름이 unconfirm→재confirm 을 허용하면 차단됨 |
| `mock/scheduleSeed.ts` | (테스트 fixture) | 그대로 유지 | runtime import 만 제거 |

#### §2-1-a Aggregate 형식 차이 영향

FE 의 시간 슬롯 heatmap (Matrix view) 는 슬롯별 가능자 ID 리스트를 요구한다. BE 의 `MemberScheduleAggregateResponse` 는 날짜 단위 카운트만 제공.

선택지:
1. FE 가 `GET /schedules` 의 모든 멤버 blocks 를 받아 클라이언트에서 슬롯 집계 (회의 N=참여자수 작아 부담 없음, 권고).
2. BE 가 슬롯 집계 엔드포인트 추가 (`GET /schedules/slot-aggregate`).

→ 현재 회의 인원 ≤ 10 예상이므로 1번으로 진행 권고.

#### §2-1-b 일괄 블록 등록 부재 영향

FE 의 자동 시안 생성기(Task 13) 는 결과 블록 N개를 한 번에 보내고 싶음. 현재는 보드 생성 후 N회 PUT.

선택지:
1. FE 에서 N+1 호출(보드 생성 + 블록 PUT 반복) 로 합의 — 100ms 단위 지연 수용 가능.
2. BE 에 `POST /schedule-boards` 의 body 에 `blocks?: ScheduleBlockInput[]` 추가 요청.

→ 우선 1번으로 진행, 사용자 체감 지연 발생 시 2번 보강 요청.

### 2-2. `src/domain/setlist-meeting/` — **대부분 대체 가능, lock 흐름 변경 필요**

API_REQUIRED_2 의 Setlist Meeting Phase 2 는 본 검증의 직접 대상은 아니나, 본 문서 §3 (FE-API-063~065) 가 동일 도메인이라 함께 정리:

- `mock/seed.ts` → API_SPEC §7 으로 대체 가능 (이전 검증 보고서 `setlist-be-live-verification-2026-04-27.md` 참조).
- `mock/memberSearchMock.ts` → `GET /api/v1/members/search` 로 대체 가능 (이미 BE 구현).
- `mock/performanceSearchMock.ts` → `GET /api/v1/performances/search` (FE-API-066 보강 적용됨) 로 대체 가능.
- `mock/songSearchMock.ts` → **유지 필수** (FE-API-067 미해결, 30곡 mock 그대로).
- `store/setlistStore.ts` → API_SPEC §7 fetcher 로 대체 가능. **단, lock 동작이 idempotent 가 아니므로** "곡 추가/삭제 후 다시 lock" UX 는 unlock → 곡 수정 → 재 lock 시퀀스로 명시적으로 분리해야 함.

### 2-3. `src/domain/auth/` — **OAuth 미대체**

- `api/oauthLogin.ts` 는 호출 대상 BE 엔드포인트(`POST /api/v1/auth/oauth/{provider}`) 부재.
- `app/(auth)/oauth/callback/[provider]/OAuthCallback.client.tsx` 도 동일 의존.
- 운영 가능하려면 BE 가 본 엔드포인트 + `member_oauth_identity` 테이블 + Kakao/Google client_secret 보유 필요. 현 시점 FE 는 빌드/타입은 통과하나 **런타임 401 차단**.

---

## 3. 차단성 결함 재현

### §3-A. PUT /schedule-boards/{boardId}/blocks/{blockId} 의 `songId` 무변경 (P1)

요청:
```http
PUT /api/v1/setlist-meetings/{m}/schedule-boards/{b}/blocks/22222222-2222-2222-2222-222222222222?memberId=4
Authorization: Bearer ...
Content-Type: application/json

{
  "songId": "019decf1-3da9-7cc0-94eb-7edaca768bd0",   ← 새 itemId
  "date": "2026-05-13",
  "startSlot": 40,
  "durationSlots": 2,
  "pinned": true,
  "paletteIndex": 3,
  "songTitleOverride": "updated title",
  "note": "updated note"
}
```

응답:
```json
{
  "data": {
    "blockId": "22222222-2222-2222-2222-222222222222",
    "songId": "11111111-1111-1111-1111-111111111111",  ← 옛 값 그대로
    "date": "2026-05-13",        ← 갱신됨
    "startSlot": 40,             ← 갱신됨
    "durationSlots": 2,          ← 갱신됨
    "pinned": true,              ← 갱신됨
    "paletteIndex": 3,           ← 갱신됨
    "songTitleOverride": "updated title",  ← 갱신됨
    "note": "updated note"       ← 갱신됨
  }
}
```

영향: 드래그-드롭으로 한 블록을 다른 곡 트랙으로 이동시키는 UX 가 silent fail. FE 는 워크어라운드로 _블록 삭제 + 신규 생성_ 시퀀스를 사용해야 함.

### §3-B. POST /schedule-boards/{boardId}/confirm 재호출 시 `401 UNAUTHORIZED` (P1)

재현 시퀀스:
1. POST `/confirm` → `200`, Practice 1건 생성 (정상).
2. POST `/unconfirm` → `200` (정상).
3. POST `/confirm` (동일 토큰, 동일 사용자) → `401 UNAUTHORIZED`.

대조:
- 동일 토큰으로 `GET /schedule-boards` → `200` (토큰은 유효함).
- 응답 본문이 `{"success":false,"message":"인증되지 않은 회원입니다.","code":"UNAUTHORIZED","data":null,...}` 으로, 다른 401 응답들은 `data` 필드 자체가 없음 — 핸들러가 다른 예외를 잘못 mapping 하는 것으로 의심.

영향: 매니저가 시안을 한 번 확정한 후 다시 다른 시안으로 교체하는 흐름이 막힘. **권고**: BE 가 (a) 이전 confirm 으로 생성된 Practice 의 처리 방침을 결정하고 (b) 명시적인 `409 ALREADY_CONFIRMED_BEFORE` 등 도메인 에러로 응답하도록 수정.

### §3-C. practice-songs/search 가 어떤 keyword 든 동일 Tool mock 반환 (FE-API-067 미해결)

```bash
curl '/api/v1/practice-songs/search?keyword=Beatles'
# → [Vicarious(Tool), Schism(Tool)]
curl '/api/v1/practice-songs/search?keyword=NeverFoundQQ123'
# → [Vicarious(Tool), Schism(Tool)]
curl '/api/v1/practice-songs/search?keyword=한국노래'
# → [Vicarious(Tool), Schism(Tool)]
```

부수 결함: Swagger 는 `query` 파라미터로 표기, 실제는 `keyword` 만 인식 (`query` 단독 호출 시 `400 INVALID_INPUT_VALUE`).

영향: FE 의 `songSearchMock.ts` (30곡) 를 BE 로 대체 불가. 본 문서 §5 권고대로 _직접 입력 fallback_ 을 유지해야 함.

### §3-D. POST /api/v1/auth/oauth/{provider} 부재 (OAuth 0503 §2-1 미구현)

OpenAPI `/api-docs` 의 `paths` 에 `/auth/oauth/*` 자체 없음. 런타임 호출 시 Spring Security 의 보호 라우트 처리로 `401 invalid_token` 반환.

영향: OAuth 로그인 흐름 100% 실패. 카카오/구글 로그인 버튼은 callback 페이지까지 도달하지만 토큰 교환 단계에서 막힘.

---

## 4. 부수 관찰 (정책/일관성)

### 4-1. `memberId` 쿼리 파라미터 일관 사용

거의 모든 인증 필요 엔드포인트가 `?memberId={long}` 을 **required query** 로 강제한다 (e.g. `/setlist-meetings/{m}/schedules/me`, `/schedule-boards/...`, `/bands/{b}/applications`). 그러나 PUT `/schedules/me?memberId=4` 를 **JWT subject=5** 로 호출했을 때 BE 는 query 의 `4` 를 무시하고 user 5 의 schedule 을 갱신 → 즉, **JWT 가 truth, query 는 redundant**.

권고: query `memberId` 를 제거하거나 optional 화. 현재는 FE 가 매번 `useAuthStore` 에서 userId 를 꺼내 query 로 같이 보내야 하는 boilerplate 가 발생.

### 4-2. PUT response staleness

PUT `/schedules/me` 응답의 `updatedAt` 이 직전 PUT 의 timestamp 를 반환 (다음 GET 호출 시에는 정상). 트랜잭션 commit 전 응답을 직렬화하는 듯. 영향 경미하나 FE 가 응답 기반 cache 갱신 시 stale 데이터 가능.

### 4-3. Confirm 시 Practice 의 `sessions` 비어 있음

`Setlist Item.sessions` 의 세션 정의(악기/정원) 는 confirm 시 생성되는 `Practice.sessions` 로 propagate 되지 않음 (`sessions: []`). FE 가 합주 생성 후 별도 `POST /api/v1/practices/{id}/sessions` 호출로 보강하는 흐름 필요. API_REQUIRED_0502 §1-3-12 에는 sessions 처리 명시 없으므로 결함이라기보다 FE 가 후속 호출로 메꿔야 함.

### 4-4. `MemberScheduleResponse` 에 멤버 식별 정보 부족

`userId` 만 있고 `name/profileImg` 없음. FE-API-052 사양의 _가용 인원 패널_ UX 를 위해 클라가 `bands/{bandId}/members` 를 조인. 회의 도메인이 band 도메인 의존성을 직접 가지지 않으려는 설계로 보이나, 실 사용성이 떨어진다.

권고: BE 응답 보강 (선호) 또는 FE 가 `useBandMembers(bandId)` 캐시 + 조인 헬퍼 도입.

### 4-5. ScheduleBlock `songId` 검증 시점

PUT block 시점에는 setlistItem 존재 여부 미검증 → confirm 시점에야 `404 SETLIST_ITEM_NOT_FOUND`. 사용자 입장에서 "왜 갑자기 confirm 이 실패하지" 혼란 가능. 권고: PUT block 시점에서 `(meeting, songId)` 쌍 검증.

---

## 5. 권장 후속 조치

### P0 (BE 측 차단성)

- [ ] **§3-B**: confirm 재호출 시 401 → 명시적 도메인 에러 (e.g. `409 SCHEDULE_BOARD_REPEATED_CONFIRM_NEEDS_CLEANUP`) 로 수정. 동시에 이전 Practice 처리 정책 결정 (delete vs keep + new).
- [ ] **§3-A**: PUT block 의 `songId` 가 update payload 에서 누락되는 버그 수정. 동시에 PUT block 시점에 `songId` 가 setlistItem 인지 검증.
- [ ] **OAuth**: API_REQUIRED_OAUTH_0503 §2-1 엔드포인트 신규 구현. FE 는 이미 callback 페이지/state 검증/`oauthLogin` API 호출 코드 완성.

### P1 (BE 측 기능성/사용성)

- [ ] **FE-API-053 슬롯 집계**: 슬롯 단위 가능자 ID 리스트가 필요한 Matrix view 가 있다면 별도 엔드포인트 추가. (또는 FE 에서 `GET /schedules` 데이터로 재계산하는 것으로 합의)
- [ ] **FE-API-055/056 일괄 블록**: `POST /schedule-boards` body 에 `blocks?: ScheduleBlockInput[]`, `PATCH /schedule-boards/{id}` body 에 `blocks?: ...` 추가. 자동 시안 / 자동 재배치 N+1 호출 비용 절감.
- [ ] **FE-API-067 song search**: 외부 API 연동 또는 내부 song 마스터 테이블. 미해결인 동안 FE 의 30곡 mock + 직접 입력 fallback 유지.
- [ ] **FE-API-052 응답 보강**: `MemberScheduleResponse` 에 `userName`, `userProfileImg` 추가.

### P2 (스펙/도구 정합성)

- [ ] **practice-songs/search**: Swagger 파라미터명 `query` → 실제 `keyword` 와 일치시킴.
- [ ] **memberId 쿼리**: 모든 인증 endpoint 의 redundant `memberId` 제거 검토 — JWT subject 로 일원화.
- [ ] **PUT response staleness**: PUT 응답 `updatedAt` 갱신 보장.

### FE 측 후속 (BE 변경 무관)

- [ ] Schedule Coordination 도메인 mock store → 실 API 호출로 이행. (P0 BE 결함 해소 후)
  - `scheduleStore` → `GET/PUT /schedules/me`, `GET /schedules`
  - `boardStore` → `GET/POST /schedule-boards`, `PATCH/DELETE`, block PUT/DELETE/PATCH pin
  - `timetableStore` → `POST /confirm`, `POST /unconfirm`
- [ ] Aggregate UI: 슬롯 단위 heatmap 은 `GET /schedules` 응답을 클라이언트 집계로 구현 (BE 별도 엔드포인트 추가 전).
- [ ] `setlistStore` lock 흐름: idempotent 호출 가정을 unlock→재 lock 패턴으로 수정.
- [ ] `songSearchMock.ts` 는 BE FE-API-067 해소 전까지 유지.

---

## 6. 검증에 사용한 시나리오 (재현용)

```bash
# 0. 셋업
curl -s -X POST localhost:8080/api/v1/members/join -H 'Content-Type: application/json' \
  -d '{"email":"qa+verify1777796551@example.com","password":"pw1234","name":"QA Verify","contact":"010-0000-0000"}'
# → id=4
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"qa+verify1777796551@example.com","password":"pw1234"}' | jq -r .data.accessToken)

# 1. 밴드/멤버 셋업 (생략 — 위 본문 참조)
# 2. 회의 생성 → meetingId
curl -s -X POST "localhost:8080/api/v1/setlist-meetings?memberId=4" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"bandId":"...","title":"QA Meeting","purpose":"GENERAL","managerId":4,
       "participantUserIds":[4,5,6],"practiceWindow":{"from":"2026-05-10","to":"2026-05-20"}}'

# 3. 멤버 schedule 등록
curl -s -X PUT "localhost:8080/api/v1/setlist-meetings/$M/schedules/me?memberId=4" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"availableDates":["2026-05-12","2026-05-13"],"unavailableDates":["2026-05-15"],
       "blocks":{"2026-05-12":"FFFFFFFFFFFF","2026-05-13":"000000FFFF00"},
       "note":"weekday evenings","completed":true}'

# 4. Setlist item 추가 → itemId, lock → practiceSongMap
curl -s -X POST "localhost:8080/api/v1/setlist-meetings/$M/items?memberId=4" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Vicarious","artist":"Tool","album":"10,000 Days","duration":"7:06",
       "sessions":[{"sessionId":"G","label":"기타","short":"G","need":1,"custom":false}]}'

curl -s -X POST "localhost:8080/api/v1/setlist-meetings/$M/lock?memberId=4" -H "Authorization: Bearer $TOKEN"

# 5. 보드 + 블록 + confirm
curl -s -X POST "localhost:8080/api/v1/setlist-meetings/$M/schedule-boards?memberId=4" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Draft 1","paletteSeed":0,"constraints":{"workingHoursStart":18,"workingHoursEnd":44,"excludeLateNight":true,"maxConsecutiveMinutes":240}}'

curl -s -X PUT "localhost:8080/api/v1/setlist-meetings/$M/schedule-boards/$B/blocks/$NEW_BLOCK?memberId=4" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"songId":"<itemId>","date":"2026-05-12","startSlot":36,"durationSlots":4,"pinned":false,"paletteIndex":0}'

curl -s -X POST "localhost:8080/api/v1/setlist-meetings/$M/schedule-boards/$B/confirm?memberId=4" -H "Authorization: Bearer $TOKEN"
```

전체 응답 raw 는 `/tmp/sched_*.json`, `/tmp/board_*.json`, `/tmp/confirm*.json`, `/tmp/lock*.json` 에 저장 (세션 종료 시 휘발).

---

## 7. 결론

**Schedule Coordination 신규 도메인이 백엔드에 들어왔다는 것 자체는 큰 진전**이다. FE-API-050~062 는 형태상 모두 구현되어 있으며 핵심 경로(스케줄 입력 → 보드 생성 → 블록 등록 → confirm → Practice 생성) 가 한 번은 정상 동작한다. 그러나 **실제 운영을 위해서는 다음 두 P1 결함이 먼저 해소되어야 한다**:

1. PUT block 의 `songId` immutability bug — 드래그-드롭 UX 차단.
2. 재 confirm 시 401 — 매니저의 시안 변경 흐름 차단.

OAuth 와 song search 는 별도 trace 로, 본 문서 권고대로 BE 작업이 추가로 필요하다. 그 외 응답 보강(FE-API-052 멤버 정보, FE-API-053 슬롯 집계) 은 FE 측 워크어라운드로 단기간 우회 가능.

위 P1 결함 두 개가 fix 되면, 본 문서의 §2 표에 따라 `scheduleStore`, `boardStore`, `timetableStore` 의 mock 을 안전하게 실 API 로 교체 가능하다.
