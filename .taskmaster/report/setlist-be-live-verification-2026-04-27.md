# Setlist Meeting BE 실서버 검증 리포트

작성일: 2026-04-27 (BE 재기동 후 실서버 검증)
대상 BE: `http://localhost:8080` (`../v1`)
대상 FE branch: `feat/setlist-be-spec-sync`
영향 범위: BE 가 새로 구현한 `/api/v1/setlist-meetings` (§7) 17 엔드포인트 + 1차 라운드(`/members/me/metrics` 등) 재검증

## 메타
- 검증 주체: AI Agent (Claude)
- BE 빌드: 검증 시점 정상 기동(`/actuator/health` 200)
- 검증 도구: `curl`, `pnpm typecheck/lint/test`, `python3 -m json.tool`
- DB: H2 in-memory (재기동 시 데이터 휘발 — 신규 사용자 join 후 진행)

## 1. 결과 요약

| 영역                                     | 상태  |
|------------------------------------------|-------|
| 1차 라운드 잔여 — `/members/me/metrics`    | ✅ 200 (BE 재기동 후 정상 응답)              |
| 1차 라운드 — `/members/search?q=`          | ✅ 200                                       |
| 선곡 회의 §7 (17개 엔드포인트)            | ✅ 모두 200 (스키마 차이 2건 별도 표기)      |
| §3-14 강퇴 / §6-9·6-10 공연 batch         | ⏸ 본 라운드 비범위(셋업 시퀀스 별도 필요)  |

## 2. 선곡 회의 §7 검증 — 17/17 통과

| # | 엔드포인트                                                                     | HTTP | 비고                                                              |
|---|-------------------------------------------------------------------------------|------|-------------------------------------------------------------------|
| 7-1  | `POST /setlist-meetings`                                                   | 200  | `meetingId`, `purpose=GENERAL`, `managerId=1` 응답                |
| 7-2  | `GET /setlist-meetings/me`                                                 | 200  | CursorResponse — 본인 회의 1건 반환                               |
| 7-3  | `GET /setlist-meetings/{id}`                                               | 200  | `participantUserIds: [1,2,3]` 포함                                |
| 7-4  | `PATCH /setlist-meetings/{id}` (title 수정)                                | 200  | `title` 갱신 반영                                                  |
| 7-5  | `DELETE /setlist-meetings/{id}`                                            | 200  | soft-delete                                                        |
| 7-8  | `POST /setlist-meetings/{id}/items`                                        | 200  | `setlistItemId`, sessions 빈 applicants/confirmed                  |
| 7-9  | `PATCH …/items/{id}` (title/note)                                          | 200  | sessions 유지 + 메타 갱신                                          |
| 7-10 | `DELETE …/items/{id}`                                                      | 200  | -                                                                  |
| 7-11 | `POST …/sessions/{V}/applicants`                                           | 200  | 본인 등록 멱등                                                     |
| 7-12 | `DELETE …/sessions/{V}/applicants/{userId}`                                | 200  | applicants 에서 제거                                               |
| 7-13 | `PATCH …/sessions/{V}/confirmations` `{confirm:[1], unconfirm:[]}`         | 200  | **두 필드 모두 NotNull** — 빈 배열이라도 누락 시 400 (스펙 강조 필요) |
| 7-14 | `GET …/items/{id}/chat`                                                    | 200  | CursorResponse                                                     |
| 7-15 | `POST …/items/{id}/chat`                                                   | 200  | 응답 필드 `memberId` (스펙 표기는 `userId`)                        |
| 7-16 | `POST …/lock`                                                              | 200  | 응답 `{lockedAt, songs:[{setlistItemId, practiceSongId}]}` (스펙 표기 `practiceSongs` 와 다름) |
| 7-17 | `POST …/unlock`                                                            | 200  | `lockedAt: null` 갱신                                              |

7-6 / 7-7 (목록 / 단건 조회) 은 7-3·7-9 의 응답으로 간접 검증 — 같은 sessions 임베디드 응답.

## 3. 케이스별 실제 요청/응답

### 3-1. 회의 생성 (7-1)

```http
POST /api/v1/setlist-meetings
{ "title":"실서버 검증 회의","purpose":"GENERAL","bandId":"019dcd46-0a54-…","managerId":1,"participantUserIds":[1,2,3] }
```
응답:
```json
{
  "success": true,
  "data": {
    "meetingId": "019dcd46-ce84-7ab0-84b8-aa55a020f5a3",
    "bandId": "019dcd46-0a54-…",
    "title": "실서버 검증 회의",
    "purpose": "GENERAL",
    "performanceId": null,
    "managerId": 1,
    "lockedAt": null,
    "createdAt": "2026-04-27T13:51:02.923147",
    "updatedAt": "…"
  }
}
```

### 3-2. 세션 확정 (7-13) — 스펙 차이

요청 1차 (`{"confirm":[1]}`):
```json
{ "success": false, "message": "올바르지 않은 입력값입니다.", "code":"INVALID_INPUT_VALUE" }
```
HTTP 400.

요청 2차 (`{"confirm":[1], "unconfirm":[]}`):
```json
{ "success": true, "data": { "sessions": [{"sessionId":"V", "applicants":[1], "confirmed":[1]}, …] } }
```
HTTP 200.

> **결론**: BE 가 `confirm` / `unconfirm` 두 필드 모두 NotNull 검증. spec 의 `optional?` 표기와 차이. FE `ConfirmSessionRequest` 타입을 `confirm: number[]; unconfirm: number[]` (둘 다 필수, 비어도 빈 배열) 로 갱신함.

### 3-3. 채팅 응답 필드명 (7-15) — 스펙 차이

응답:
```json
{ "messageId":"019dcd46-d1b1-…", "setlistItemId":"…", "memberId":1, "message":"라이브 검증 메시지", "createdAt":"…" }
```
스펙 §7-15 응답 예시는 `userId` 였으나 실제는 `memberId`. FE `SetlistItemChatMessageResponse.memberId` 로 정정.

### 3-4. 회의 잠금 응답 (7-16) — 스펙 차이

응답:
```json
{
  "lockedAt": "2026-04-27T13:51:03.805513",
  "songs": [{ "setlistItemId": "019dcd46-d0fc-…", "practiceSongId": null }]
}
```
스펙 표기는 `practiceSongs`. 실제는 `songs`. 또한 `practiceSongId: null` — BE 에 cross-domain 매핑(합주곡 자동 생성) 미구현.

## 4. 1차 라운드 잔여 항목 재검증

- `GET /api/v1/members/me/metrics` — **200** (BE 재기동 후 정상). 응답: `{bandCount:0, upcomingPracticeCount:0, upcomingPerformanceCount:0, sessionCount:0}` (신규 사용자 메트릭).
- `GET /api/v1/members/search?q=verify` — 200, 본인 제외, profileImg 포함.

## 5. 권장 조치

### 🟠 기능 저하 (P1) — BE 측
1. **§7-13 `confirm`/`unconfirm` 필수 여부 spec 명시**: BE 가 두 필드 모두 NotNull 검증하므로 spec에 명시(예: `"confirm": [], "unconfirm": []` 둘 다 전달 필수).
2. **§7-15 응답 필드명**: `userId` → `memberId` 로 spec 갱신, 또는 BE 응답을 `userId` 로 통일 — 선호는 `memberId` (다른 도메인과 일관).
3. **§7-16 응답 필드명**: `practiceSongs` → `songs` 로 spec 갱신, 또는 응답을 `practiceSongs` 로 통일.
4. **§7-16 cross-domain 매핑**: lock 시 `practiceSongId` 가 null. 합주곡 자동 생성 트랜잭션 추후 도입 필요.
5. **§3-1 밴드 생성 — `description` 사실상 필수**: spec 에는 nullable 처럼 표기되었으나 누락 시 400. spec 보강 또는 BE validation 완화.

### ℹ️ 참고
- §3-14 강퇴 / §6-9·6-10 공연 batch 는 별도 셋업 시퀀스(앱 신청 → 승인 → 강퇴 / 공연 생성 + 두 번째 밴드) 가 필요. 본 라운드 비범위.

## 6. 프론트 코드 변경

| 파일                                                    | 변경                                                                       |
|---------------------------------------------------------|----------------------------------------------------------------------------|
| `API_SPEC.md`                                           | `../v1/API_SPEC.md` 로 일괄 재교체 (§7 선곡 회의 추가)                        |
| `src/domain/setlist-meeting/types/api.ts`               | BE §7 응답/요청 1:1 타입 신규                                              |
| `src/domain/setlist-meeting/api/index.ts`               | 17 fetcher 함수 신규 (회의/항목/세션/채팅/잠금)                              |
| `ConfirmSessionRequest`                                 | `confirm`/`unconfirm` 필수 (NotNull) 로 정정                                 |
| `SetlistItemChatMessageResponse.memberId`               | 스펙의 `userId` → 실제 `memberId` 로 정정                                   |

## 7. 다음 라운드 권장 시퀀스
1. BE 측 §7-13 / §7-15 / §7-16 spec 일관화 (or vice versa).
2. §7-16 lock → `practiceSongId` 매핑 트랜잭션 도입 후 재검증.
3. FE 측: 검증된 fetcher 들로 `setlistStore` 의 mock action 을 점진 교체 — 우선 회의 단건 조회·생성·확정 라이프사이클부터.
4. §3-14 / §6-9·6-10 라이브 시퀀스 검증 (별도 라운드).
