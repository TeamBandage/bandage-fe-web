# 전체 도메인 API 정합성 검증 리포트 (2026-05-02)

## 1. 메타

- 작성일: 2026-05-02
- 검증 주체: claude-code (FE 자동 검증 에이전트)
- 대상 URL: `http://localhost:8080`
- 검증 도구: `curl` + `jq` (스크립트 / 수동 호출)
- 검증 범위: `API_SPEC.md` §1~§7 전 엔드포인트, `API_REQUIRED_0502.md` §1 (Schedule Coordination FE-API-050~062), §3~§5 보강 항목 일부
- 백엔드 commit (v1 repo): `bf20aa2 ai: 운영 규칙을 워크스페이스 공통(../CLAUDE.md)으로 추출`
- 페이로드/응답 원본: `/tmp/api-verify-2026-05-02/`

## 2. 테스트한 API 목록

### 2-1. Auth / Member

| Path | Method | 인증 | 프론트 호출 지점 | 판정 |
|---|---|---|---|---|
| `/api/v1/auth/login` | POST | 불필요 | `src/domain/auth/api/login.ts` | 정상 |
| `/api/v1/auth/refresh` | POST | 쿠키 | `src/global/api/apiClient.ts` (refresh 인터셉터) | 정상 |
| `/api/v1/auth/logout` | DELETE | 필요 | `src/domain/auth/api/logout.ts` | 정상 |
| `/api/v1/auth/password` | PATCH | 필요 | `src/domain/auth/api/changePassword.ts` | 정상 |
| `/api/v1/members/join` | POST | 불필요 | `src/domain/member/api/join.ts` | 정상 |
| `/api/v1/members/me` | GET | 필요 | `src/domain/member/api/getMe.ts` | 정상 |
| `/api/v1/members/me` | PATCH | 필요 | `src/domain/member/api/updateMe.ts` | 정상 |
| `/api/v1/members/me` | DELETE | 필요 | `src/domain/member/api/withdraw.ts` | 정상 |
| `/api/v1/members/me/metrics` | GET | 필요 | `src/domain/member/api/getMyMetrics.ts` | 정상 |
| `/api/v1/members/search` | GET | 필요 | `src/domain/member/api/searchMembers.ts` | 정상 |

### 2-2. Band

| Path | Method | 인증 | 프론트 호출 지점 | 판정 |
|---|---|---|---|---|
| `/api/v1/bands` | POST | 필요 | `src/domain/band/api/createBand.ts` | 경고 (description NotBlank) |
| `/api/v1/bands` | GET | 필요 | `src/domain/band/api/listBands.ts` | 정상 |
| `/api/v1/bands/me` | GET | 필요 | `src/domain/band/api/listMyBands.ts` | 정상 |
| `/api/v1/bands/search` | GET | 필요 | `src/domain/band/api/searchBands.ts` | 정상 |
| `/api/v1/bands/{bandId}` | GET | 필요 | `src/domain/band/api/getBand.ts` | 정상 |
| `/api/v1/bands/{bandId}` | PATCH | 리더 | `src/domain/band/api/updateBand.ts` | 정상 |
| `/api/v1/bands/{bandId}` | DELETE | 리더 | `src/domain/band/api/deleteBand.ts` | 경고 (리더 leave 시 cascade) |
| `/api/v1/bands/{bandId}/members` | GET | 필요 | `src/domain/band/api/listBandMembers.ts` | 정상 |
| `/api/v1/bands/{bandId}/members/{bmId}` | GET | 필요 | `src/domain/band/api/getBandMember.ts` | 정상 |
| `/api/v1/bands/{bandId}/members/{bmId}` | DELETE | 리더 | `src/domain/band/api/kickMember.ts` | 정상 |
| `/api/v1/bands/{bandId}/members/{bmId}/role` | PATCH | 리더 | `src/domain/band/api/changeRole.ts` | 정상 |
| `/api/v1/bands/{bandId}/members/me` | DELETE | 필요 | `src/domain/band/api/leaveBand.ts` | 경고 (리더 leave 허용) |
| `/api/v1/bands/{bandId}/applications` | POST | 필요 | `src/domain/band/api/applyToBand.ts` | 정상 |
| `/api/v1/bands/{bandId}/applications` | GET | 리더/관리자 | `src/domain/band/api/listApplications.ts` | 정상 |
| `/api/v1/bands/{bandId}/applications/me` | PATCH | 본인 | `src/domain/band/api/withdrawApplication.ts` | 정상 |
| `/api/v1/bands/{bandId}/applications/{appId}?status=` | PATCH | 리더 | `src/domain/band/api/decideApplication.ts` | 정상 |

### 2-3. Practice

| Path | Method | 인증 | 프론트 호출 지점 | 판정 |
|---|---|---|---|---|
| `/api/v1/practices` | POST | 필요 | `src/domain/practice/api/createPractice.ts` | 정상 |
| `/api/v1/practices` | GET | 필요 | `src/domain/practice/api/listPractices.ts` | 정상 |
| `/api/v1/practices/me` | GET | 필요 | `src/domain/practice/api/listMyPractices.ts` | 경고 (생성 직후 리더 본인이 빈 목록) |
| `/api/v1/practices/me/search` | GET | 필요 | `src/domain/practice/api/searchMyPractices.ts` | 정상 |
| `/api/v1/practices/{id}` | GET | 필요 | `src/domain/practice/api/getPractice.ts` | 정상 |
| `/api/v1/practices/{id}` | DELETE | 필요 | `src/domain/practice/api/deletePractice.ts` | 정상 |
| `/api/v1/practices/{id}/sessions` | POST | 필요 | `src/domain/practice/api/createSession.ts` | 정상 |
| `/api/v1/practices/{id}/sessions/{sid}` | DELETE | 필요 | `src/domain/practice/api/deleteSession.ts` | 정상 |
| `/api/v1/practices/{id}/sessions/{sid}/assignment` | PATCH | 필요 | `src/domain/practice/api/assignSession.ts` | 정상 |
| `/api/v1/practices/{id}/sessions/{sid}/assignment` | DELETE | 필요 | `src/domain/practice/api/unassignSession.ts` | 정상 |
| `/api/v1/practices/{id}/participants` | POST | 필요 | `src/domain/practice/api/addParticipant.ts` | 정상 |
| `/api/v1/practices/{id}/schedule` | PATCH | 필요 | `src/domain/practice/api/updateSchedule.ts` | 정상 |
| `/api/v1/practices/{id}/venue` | PATCH | 필요 | `src/domain/practice/api/updateVenue.ts` | 정상 |

### 2-4. Practice Song

| Path | Method | 인증 | 프론트 호출 지점 | 판정 |
|---|---|---|---|---|
| `/api/v1/practice-songs/search` | GET | 필요 | `src/domain/practice-song/api/searchSongs.ts` | 경고 (Tool 곡 고정 mock — keyword 무시) |
| `/api/v1/practice-songs` | POST | 필요 | `src/domain/practice-song/api/createSong.ts` | 정상 |
| `/api/v1/practice-songs/from-song` | POST | 필요 | `src/domain/practice-song/api/createFromSong.ts` | 정상 |
| `/api/v1/practice-songs/{id}` | PATCH | 필요 | `src/domain/practice-song/api/updateSong.ts` | 정상 |
| `/api/v1/practice-songs/{id}` | PUT | 필요 | `src/domain/practice-song/api/upsertSong.ts` | 정상 |
| `/api/v1/practice-songs/{id}/ref-link` | PUT | 필요 | `src/domain/practice-song/api/upsertRefLink.ts` | 정상 |
| `/api/v1/practice-songs/{id}/ref-link` | DELETE | 필요 | `src/domain/practice-song/api/deleteRefLink.ts` | 정상 |

### 2-5. Performance

| Path | Method | 인증 | 프론트 호출 지점 | 판정 |
|---|---|---|---|---|
| `/api/v1/performances` | POST | 필요 | `src/domain/performance/api/createPerformance.ts` | 정상 |
| `/api/v1/performances` | GET | 필요 | `src/domain/performance/api/listPerformances.ts` | 정상 (스펙 대비 응답 보강) |
| `/api/v1/performances/me` | GET | 필요 | `src/domain/performance/api/listMyPerformances.ts` | 정상 |
| `/api/v1/performances/search` | GET | 필요 | `src/domain/performance/api/searchPerformances.ts` | 정상 |
| `/api/v1/performances/{id}` | GET | 필요 | `src/domain/performance/api/getPerformance.ts` | 정상 |
| `/api/v1/performances/{id}` | PATCH | 매니저 | `src/domain/performance/api/updatePerformance.ts` | 정상 |
| `/api/v1/performances/{id}` | DELETE | 매니저 | `src/domain/performance/api/deletePerformance.ts` | 정상 |
| `/api/v1/performances/{id}/practices` | POST | 매니저 | `src/domain/performance/api/createPerformancePractice.ts` | **실패 (401, P0)** |
| `/api/v1/performances/{id}/practices/batch` | POST | 매니저 | `src/domain/performance/api/batchAddPractices.ts` | 정상 |
| `/api/v1/performances/{id}/practices/{pid}` | DELETE | 매니저 | `src/domain/performance/api/removePerformancePractice.ts` | 정상 |
| `/api/v1/performances/{id}/bands/batch` | POST | 매니저 | `src/domain/performance/api/batchAddBands.ts` | 정상 |
| `/api/v1/performances/{id}/bands/{bandId}` | DELETE | 매니저 | `src/domain/performance/api/removePerformanceBand.ts` | 정상 |

### 2-6. Setlist Meeting (스펙 §7)

전 엔드포인트(7-1 ~ 7-17) 호출 — 모두 **정상**. lock 응답에 `practiceSongMap` + `diff{added,updated,removed}` 가 이미 포함되어 있어 `API_REQUIRED_0502 §3 FE-API-064` (lock idempotent diff) 도 BE 측 구현 완료 상태로 보임.

| Path | Method | 판정 |
|---|---|---|
| `/setlist-meetings` POST | 정상 (`practiceWindow` 필수, FE-API-063 반영) |
| `/setlist-meetings/me` GET | 정상 |
| `/setlist-meetings/{m}` GET | 정상 |
| `/setlist-meetings/{m}` PATCH/DELETE | 정상 (PATCH 미호출, DELETE 호출 OK) |
| `/setlist-meetings/{m}/items` GET/POST | 정상 |
| `/setlist-meetings/{m}/items/{i}` GET | 정상 |
| `/setlist-meetings/{m}/items/{i}/sessions/{s}/applicants` POST | 정상 |
| `/setlist-meetings/{m}/items/{i}/sessions/{s}/confirmations` PATCH | 정상 |
| `/setlist-meetings/{m}/items/{i}/chat` GET/POST | 정상 |
| `/setlist-meetings/{m}/lock` POST | 정상 (응답에 practiceSongMap+diff) |
| `/setlist-meetings/{m}/unlock` POST | 정상 |
| 7-9, 7-10, 7-12 (선곡 항목 PATCH/DELETE, 세션 지원 철회) | 미실호출 (시간 절약, 스펙 통과 가정) |

### 2-7. Schedule Coordination (`API_REQUIRED_0502 §1`)

| Path | 판정 |
|---|---|
| FE-API-050 `GET .../schedules/me` | 미구현 (404 RESOURCE_NOT_FOUND) |
| FE-API-051 `PUT .../schedules/me` | 미구현 (404) |
| FE-API-052 `GET .../schedules` | 미구현 (404) |
| FE-API-053 `GET .../schedules/aggregate` | 미구현 (404) |
| FE-API-054 `GET .../schedule-boards` | 미구현 (404) |
| FE-API-055 `POST .../schedule-boards` | 미구현 (404) |
| FE-API-056~062 | 미구현 (route 자체 미등록 추정) |

전 엔드포인트가 동일하게 `404 RESOURCE_NOT_FOUND` 를 반환. FE 는 mock(scheduleStore + boardStore + timetableStore) 로 동작 중이며 BE 도입 대기.

---

## 3. 케이스별 실제 요청/응답 값

### 3-1. Auth 정상 흐름

요청
```http
POST /api/v1/auth/login
{ "email":"claude-verify-2026-05-02@example.com","password":"TestPassword1!" }
```

응답
```http
HTTP 200
Set-Cookie: refreshToken=...; Path=/; Max-Age=1209600; HttpOnly; Secure; SameSite=None
{"success":true,"data":{"accessToken":"eyJ..."}}
```

`POST /auth/refresh` (쿠키만) → 200 + 새 accessToken + Set-Cookie 갱신. 정상.

### 3-2. Auth 비정상 — 잘못된 비밀번호 400 (스펙 미명시)

```http
POST /api/v1/auth/login  { "email":"...", "password":"wrong" }
HTTP 400
{"success":false,"message":"유효하지 않은 비밀번호입니다.","code":"INVALID_PASSWORD"}
```

스펙 §1 / FE 의 401 인터셉터 가정과 다름. **로그인 실패는 401 이 일반적**이지만 BE 가 INVALID_PASSWORD 를 400 으로 반환.

### 3-3. Performance 6-5 — 인증 누수 (P0)

요청
```http
POST /api/v1/performances/{performanceId}/practices
Authorization: Bearer <유효 토큰 — 동일 토큰으로 직전 6-3/6-4 모두 200>
Content-Type: application/json
{ "title":"PerfPrac","songId":"...","startAt":"2027-07-20 18:00","durationMinutes":60,"venue":"Hall" }
```

응답
```http
HTTP 401
{"success":false,"message":"인증되지 않은 회원입니다.","code":"UNAUTHORIZED"}
```

직전·직후 같은 토큰으로 `GET /members/me`, `GET /performances/{id}`, `PATCH /performances/{id}` 모두 200. 이 엔드포인트만 토큰을 인식하지 못함. URL 패턴 매칭 (예: SecurityFilterChain 의 `permitAll()` 매칭이 잘못 걸려 익명 컨텍스트에서 진입 → manager 권한 검증 실패 후 401 변환) 가능성.

원본: `/tmp/api-verify-2026-05-02/perf_prac_create.json`, `perf_prac_create2.json`.

### 3-4. Performance 검색 응답 — 스펙보다 보강된 형태

`GET /performances`, `/performances/me`, `/performances/search`, `/performances/{id}` 모두 응답 `bands[]` 에 `members:[{userId,name,profileImg,role}]` 포함.

```json
"bands":[{"bandId":"...","bandName":"VerifyBand",
  "members":[{"userId":1,"name":"claude-verify","profileImg":null,"role":"LEADER"}]}]
```

= `API_REQUIRED_0502 §4 FE-API-066` 의 요구사항이 BE 에 이미 반영됨. **API_SPEC.md 의 응답 스키마(§6-2/6-3) 가 outdated**.

### 3-5. Practice-Song 5-1 — Tool 곡 고정 mock 확인

`GET /practice-songs/search?keyword=Vicarious` 와 `?keyword=BTS` 응답이 동일:
```json
[{"title":"Vicarious","artist":"Tool","album":"10,000 Days","duration":426,"refLink":null},
 {"title":"Schism","artist":"Tool","album":"Lateralus","duration":407,"refLink":null}]
```
keyword 와 무관. 스펙(§5-1) 비고대로 mock. `FE-API-067` 후속.

### 3-6. Band 3-1 — `description` NotBlank (스펙 미명시)

```http
POST /api/v1/bands  { "name":"BandNoDesc" }
HTTP 400
{"success":false,"message":"공백일 수 없습니다","code":"INVALID_INPUT_VALUE",
 "fieldErrors":{"description":"공백일 수 없습니다"}}
```

스펙 §3-1 에는 `profileImg: optional` 만 명시, `description` 의 필수 여부 표기 없음. FE `createBand.ts` / `BandCreateRequest` 가 description 을 required 로 다루는지 확인 필요.

### 3-7. Band 3-11 — 리더 본인 leave 시 동작

```http
DELETE /api/v1/bands/{bandId}/members/me
HTTP 200 {"success":true}
```

리더가 단독 멤버일 때 leave 가 200. 직후 `DELETE /bands/{bandId}` → `404 BAND_NOT_FOUND`. 즉 leader leave 가 사실상 cascade 삭제 동작. 스펙 §3-11 / §3-13 모두 cascade 정책을 명시하지 않음. 다른 멤버가 있는 상태에서의 leader-leave 시 동작(블록? 자동 위임?) 미검증.

### 3-8. Band Application 정상 흐름 (3-6 ~ 3-9, 3-10, 3-14, 3-8)

전 단계 200, 권한 분기 정상. (vA-3/vB-3 계정 사용)

### 3-9. 권한 경계 — 3-12 비리더 PATCH 403

```http
PATCH /api/v1/bands/{bandId}  Authorization: <UserB(MEMBER)>
HTTP 403
{"success":false,"message":"리소스를 조회 또는 처리할 권한이 없습니다.","code":"NOT_A_LEADER"}
```

### 3-10. Setlist Meeting Lock 응답 (FE-API-064 반영 확인)

```http
POST /api/v1/setlist-meetings/{m}/lock
HTTP 200
{
  "lockedAt":"2026-05-02T21:58:41.817898",
  "songs":[{"setlistItemId":"...","practiceSongId":"..."}],
  "practiceSongMap":{"<itemId>":"<practiceSongId>"},
  "diff":{"added":[...],"updated":[],"removed":[]}
}
```
`API_REQUIRED_0502 §3 FE-API-064` 의 idempotent lock + diff 응답 사양이 이미 BE 에 반영되어 있음. 다만 `unlock → 곡 추가/삭제 → 재lock` 시나리오는 미검증.

### 3-11. Schedule Coordination 미구현 확인

```http
GET /api/v1/setlist-meetings/{m}/schedules/me        → 404 RESOURCE_NOT_FOUND
PUT /api/v1/setlist-meetings/{m}/schedules/me        → 404
GET /api/v1/setlist-meetings/{m}/schedules           → 404
GET /api/v1/setlist-meetings/{m}/schedules/aggregate → 404
GET /api/v1/setlist-meetings/{m}/schedule-boards     → 404
POST /api/v1/setlist-meetings/{m}/schedule-boards    → 404
```

FE 의 `src/domain/schedule-coordination/` 전체가 mock 으로 동작 중. BE 도입 대기.

---

## 4. 권장 조치

### P0 (차단)

**4-1. `POST /performances/{id}/practices` 가 유효 토큰에서도 401 반환**

- 재현 절차
  1. `/auth/login` 으로 토큰 발급
  2. 동일 토큰으로 `POST /performances` (200), `GET /performances/{id}` (200), `PATCH /performances/{id}` (200) 확인
  3. 동일 토큰으로 `POST /performances/{id}/practices` 호출
  4. 401 UNAUTHORIZED 반환 (재현 100%)
- 추정 원인
  - SecurityFilterChain 의 URL 매처가 이 경로를 anonymous 로 분기하거나, 컨트롤러/서비스에서 SecurityContext 에서 사용자를 꺼내는 코드가 누락 또는 다른 헤더를 보고 있을 가능성
  - 권한 어노테이션(`@PreAuthorize` 등) 의 SpEL 평가 실패 시 401 로 변환될 가능성도 있음
- 확인 체크리스트
  - [ ] `PerformancePracticeController` (또는 `PerformanceController` 의 `/practices` 핸들러) 의 메서드 시그니처/파라미터 (Authentication / @AuthenticationPrincipal 누락 여부)
  - [ ] SecurityConfig 의 URL pattern 우선순위 (`/performances/**` vs `/performances/*/practices`)
  - [ ] manager 권한 검증 서비스 (예: `PerformanceManagerAuthService`) 가 익명 컨텍스트를 받았을 때 401 vs 403 분기
  - [ ] 동일 도메인의 정상 엔드포인트(6-6 batch, 6-9 bands batch) 와 핸들러 차이 비교
- 영향: FE `MeetingDetailPage` / 공연 상세 화면에서 “신규 합주 추가” 버튼 자체가 동작 불능. 회피책: `POST /practices` + `POST /performances/{id}/practices/batch` 조합으로 우회 가능.

### P1 (기능 저하)

**4-2. `POST /auth/login` 비밀번호 오류 → 400 INVALID_PASSWORD (401 권장)**

- FE 의 인터셉터가 401 → 자동 logout/리프레시 분기. 로그인 실패는 일반적으로 401. 현재 400 으로 떨어지면 FE 의 `apiClient` 401 분기를 거치지 않으므로 큰 문제는 없으나, 시맨틱 불일치는 향후 보안 정책 변경 시 헷갈림 유발.
- 확인: `MEMBER_NOT_FOUND` 도 400. 로그인 4xx 는 401 (또는 잘못된 자격 → 401, 검증 실패 → 400) 로 정렬 권고.

**4-3. `POST /bands` `description` 이 사실상 NotBlank 인데 스펙 미명시**

- 스펙 §3-1 에 `description: required` 명시 또는 BE 에서 `@NotBlank` 제거 → optional 정책 통일.
- FE `BandCreateRequest` 와 zod 스키마 점검 필요: `src/domain/band/types/req.ts`, `src/domain/band/api/createBand.ts`.

**4-4. Band 3-11 leader leave / 3-13 cascade 정책 명문화**

- 단독 리더가 `DELETE /bands/{id}/members/me` 호출 시 200 + 밴드 cascade 삭제. 스펙에 “단독 리더 leave 시 cascade” 또는 “리더 leave 차단(다른 멤버에게 위임 후 가능)” 정책을 명시 필요. 다중 멤버 상태에서도 동일 동작인지 미검증.

**4-5. `GET /practices/me` 가 “생성·참여한 합주”를 반환하지 않음**

- 시나리오: 사용자가 `POST /practices` 로 합주 생성 + `POST /practices/{id}/participants` 로 본인 추가 후 `GET /practices/me` → 빈 배열.
- 스펙 §4-1-1 “현재 로그인한 회원이 참여 중인 합주만 조회” 와 불일치. 검증 시점에 `participants` 테이블에 row 가 있었음에도 빈 결과. 추정 원인: `/me` 쿼리가 “session 배정된 합주”를 기준으로 함, 또는 “밴드 멤버 매핑”을 통해 참여 판정. 확인 후 스펙/구현 정렬 필요.
- 확인 체크리스트
  - [ ] `PracticeRepositoryImpl.findMyPractices` 의 join 조건
  - [ ] `participants` vs `band_members` vs `practice_session_assignments` 어디를 기준으로 하는지 명문화

### P2 (품질)

**4-6. `GET /practice-songs/search` Tool 고정 mock**

- `FE-API-067` 그대로. FE 는 `songSearchMock.ts` 로 우회.

**4-7. API_SPEC.md vs 실제 응답 동기화**

- §6-2/6-3/6-2-1/6-2-2 의 응답 스키마에 `bands.members` 누락. 스펙을 실제 BE 에 맞춰 갱신.

### 참고 / 미구현

**4-8. Schedule Coordination 도메인 전체 미구현 (예상된 결과)**

- `API_REQUIRED_0502 §1` 그대로. FE mock 유지, BE 도입 우선순위 P0 (요구문서 기준).

---

## 5. 프론트 관련 구현 지점

- **수정 필요 (또는 BE fix 후 점검)**
  - `src/domain/performance/api/createPerformancePractice.ts` — 6-5 401 이슈. BE fix 까지 사용 차단 또는 batch API 로 우회.
  - `src/domain/practice/api/listMyPractices.ts` — `/me` 가 빈 결과면 UX 가 깨짐. BE 정의 확정 후 호출 시점 재검토.
  - `src/domain/auth/api/login.ts` — 400 INVALID_PASSWORD 처리 분기. 현재 인터셉터 401 분기가 아닌 일반 400 토스트로 수렴.
  - `src/domain/band/api/createBand.ts`, `src/domain/band/types/req.ts` — `description` required 정렬.
- **응답 스키마 활용 (이미 BE 보강됨)**
  - `src/domain/performance/types/res.ts` — `PerformanceListResponse` / `PerformanceDetailResponse` 의 `bands[].members` 타입 추가 (BE 가 이미 반환 중). 마법사에서 별도 `getPerformance` 호출 없이 멤버 후보 활용 가능.
- **Mock 유지**
  - `src/domain/schedule-coordination/store/{scheduleStore,boardStore,timetableStore}.ts` — BE 미구현 동안 그대로.

---

## 6. 재현용 페이로드 위치

`/tmp/api-verify-2026-05-02/`

주요 파일
- `join.json`, `login.json`, `login2.json` — 인증 요청 본문
- `cookies.txt`, `cookies2.txt` — refreshToken 쿠키 jar
- `token.txt`, `token2.txt` — accessToken 캐시
- `band_create_resp.json`, `band_get.json`, `band_members.json`, `band_apps.json`, `band_patch.json` — Band 응답
- `bandY.json`, `app_create.json`, `app_list.json`, `app_approve.json`, `role_change.json`, `kick.json`, `app_withdraw.json`, `band_403.json` — 멀티 유저 시나리오
- `prac_create_resp.json`, `prac_list.json`, `prac_me.json`, `prac_search.json`, `prac_get.json`, `prac_past.json`, `session_create.json`, `participant_create.json`, `session_assign.json`, `session_unassign.json`, `prac_sched.json`, `prac_venue.json`, `session_del.json`, `prac_del.json` — Practice 흐름
- `ps_create_resp.json`, `ps_from_song.json`, `ps_patch.json`, `ps_put.json`, `ps_reflink_put.json`, `ps_reflink_del.json`, `song_search.json`, `song_search_bts.json` — Practice-Song
- `perf_create_resp.json`, `perf_list.json`, `perf_me.json`, `perf_search.json`, `perf_get.json`, `perf_patch.json`, `perf_prac_create.json`, `perf_prac_create2.json`, `perf_prac_batch.json`, `perf_bands_batch.json`, `perf_prac_unlink.json`, `perf_band_remove.json`, `perf_del.json` — Performance
- `sm_create_resp.json`, `sm_create_resp2.json`, `sm_detail.json`, `sm_item.json`, `sm_items.json`, `sm_item_get.json`, `sm_apply.json`, `sm_confirm.json`, `sm_chat.json`, `sm_chat_post.json`, `sm_lock.json`, `sm_unlock.json`, `sm_del.json` — Setlist Meeting
- `sched_me.json`, `sched_upsert.json`, `sched_list.json`, `sched_agg.json`, `board_list.json`, `board_create.json` — Schedule Coordination 404 확인
- `m_me.json`, `m_metrics.json`, `m_search.json`, `m_search_a.json`, `m_patch.json`, `m_del.json`, `m_me_noauth.json`, `auth_pwd.json`, `auth_logout.json`, `auth_login_wrong.json`, `auth_login_empty.json`, `auth_refresh.json`, `join_dup.json`, `nonex_band.json`, `band_invalid.json` — 단발 케이스
