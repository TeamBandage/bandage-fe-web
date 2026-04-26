# Practice / Practice-Song API 프론트 연동 검증 리포트 (Task 8 / Issue #10)

- 작성일: 2026-04-24 (Asia/Seoul)
- 검증 주체: 프론트엔드 (Bandage-FE-Web, branch `feat/#10-practice-song`)
- 백엔드 기동 URL: `http://localhost:8080`
- 검증 도구: `curl` 직접 호출. 재현용 페이로드 `/tmp/bandage-practice-test/*`
- 검증 범위: `src/domain/practice/api/*` 11개 + `src/domain/practice-song/api/*` 2개 = 총 13개 엔드포인트 호출
- 검증 결과 요약: **블로커 1건(합주곡 생성 엔드포인트 부재)** 때문에 13개 중 **9개가 실경로 재현 불가** 상태. 나머지 4개는 호출 형태만 확인 가능 (엔드포인트 미구현 또는 선결 조건 필요).

---

## 1. 테스트한 API 목록

| # | Path | Method | FE 함수 | 판정 |
| --- | --- | --- | --- | --- |
| 1 | `/api/v1/practices?bandId=...&pageSize=...` | GET | `getPractices` | **미구현** (HTTP 401 + `Allow: POST`) |
| 2 | `/api/v1/practices` | POST | `createPractice` | 경로 존재 확인. 유효 songId 없어 실성공 불가 — 404 "요청한 합주 곡 정보를 찾을 수 없습니다." |
| 3 | `/api/v1/practices/{practiceId}` | GET | `getPractice` | 유효 practiceId 없어 경로 형태만 확인 (블로커 1) |
| 4 | `/api/v1/practices/{practiceId}` | DELETE | `deletePractice` | 동상 (블로커 1) |
| 5 | `/api/v1/practices/{practiceId}/schedule` | PATCH | `updateSchedule` | 동상 |
| 6 | `/api/v1/practices/{practiceId}/venue` | PATCH | `updateVenue` | 동상 |
| 7 | `/api/v1/practices/{practiceId}/sessions` | POST | `createSession` | 동상 |
| 8 | `/api/v1/practices/{practiceId}/sessions/{sessionId}` | DELETE | `deleteSession` | 동상 |
| 9 | `/api/v1/practices/{practiceId}/participants` | POST | `addParticipant` | 동상 |
| 10 | `/api/v1/practices/{practiceId}/sessions/{sessionId}/assignment` | PATCH | `assignSession` | 동상 |
| 11 | `/api/v1/practices/{practiceId}/sessions/{sessionId}/assignment` | DELETE | `unassignSession` | 동상 |
| 12 | `/api/v1/practice-songs/{songId}/ref-link` | PUT | `upsertRefLink` | 경로 존재. 존재하지 않는 songId 로 호출 시 404 "요청한 합주 곡 정보를 찾을 수 없습니다." ("upsert" 시맨틱 아님 — 기존 곡 전제) |
| 13 | `/api/v1/practice-songs/{songId}/ref-link` | DELETE | `deleteRefLink` | 동상 (블로커 2) |

---

## 2. 케이스별 실제 요청/응답 값

### 2-1. 인증 셋업

```bash
# 신규 유저 등록/로그인 후 Bearer 확보
POST /api/v1/members/join → 200 { id: 8, email: "practice-<ts>@bandage.test" }
POST /api/v1/auth/login  → 200 + Set-Cookie refreshToken + accessToken (len 196)
```

이전 Task 6/7 리포트와 동일하게 **인증 단계 자체는 정상** 동작. 모든 후속 호출에 `Authorization: Bearer <token>` 첨부.

### 2-2. GET `/api/v1/practices` — 목록 엔드포인트 미구현

요청
```http
GET /api/v1/practices?pageSize=5 HTTP/1.1
Authorization: Bearer <token>
```
응답 (HTTP 401)
```http
Allow: POST
WWW-Authenticate: Bearer error="invalid_token"
```
```json
{"success":false,"message":"인증되지 않은 회원입니다.","data":null,"timestamp":"..."}
```
판정: `Allow: POST` 헤더가 **"이 경로는 POST 만 지원"** 을 의미하므로 GET 핸들러가 구현되지 않은 상태. Spring Security 필터가 인증 오류를 우선 던지면서 405 대신 401 로 표면화됨. FE `usePractices` 훅은 `ApiError` 로 변환되어 목록 페이지의 `ErrorState` 경로로 폴백.

### 2-3. POST `/api/v1/practices` — 유효 songId 없이 404

요청
```json
{
  "title": "QA Practice Test",
  "song": "550e8400-e29b-41d4-a716-446655440000",
  "venue": "홍대 스튜디오",
  "startAt": "2026-12-15 18:00",
  "durationMinutes": 60
}
```
응답 (HTTP 404)
```json
{
  "success": false,
  "message": "요청한 합주 곡 정보를 찾을 수 없습니다.",
  "data": null,
  "timestamp": "2026-04-24T13:33:52.918859"
}
```
판정: 경로 자체는 정상 매핑됨. 프론트가 보내는 요청 shape 또한 정확히 수용됨(NotFound 가 검증 오류가 아님을 확인). **블로커 1 — 존재하는 songId 가 있어야 실성공 가능**.

### 2-4. PUT `/api/v1/practice-songs/{songId}/ref-link` — 기존 Song 전제

요청
```http
PUT /api/v1/practice-songs/019dbd8a-7777-7777-7777-777777777777/ref-link
Authorization: Bearer <token>
Content-Type: application/json

{"refLink":"https://www.youtube.com/watch?v=test"}
```
응답 (HTTP 404) — 동일 메시지 "요청한 합주 곡 정보를 찾을 수 없습니다."

판정: "upsert" 라는 이름이지만 **존재하지 않는 song 을 새로 만들어 주지 않음**. 이름과 실제 동작이 일치하지 않아 혼동의 소지가 있음.

### 2-5. Song 생성/조회 엔드포인트 탐색 — 모두 401

아래 모든 경로에 Bearer 를 담아 호출해도 401 반환 (실제로는 미구현인 경로에 대해 Spring Security 가 401 로 감싸는 것으로 추정):

| 경로 | HTTP |
| --- | --- |
| `POST /api/v1/songs` | 401 |
| `GET /api/v1/songs` | 401 |
| `POST /api/v1/practice-songs` | 401 |
| `GET /api/v1/practice-songs` | 401 |

결론: **공개된 합주곡(Song) 생성/조회 엔드포인트가 API_SPEC 어디에도 등재되어 있지 않으며, 실제 서버에도 존재하지 않는 것으로 보임.** 이 때문에 Practice 생성/세션·참여자·일정·장소·삭제 전 플로우를 실제로 돌려볼 수 없음.

---

## 3. 권장 조치 내용 및 검토 필요 사항

### A. (Backend, 최우선) Song 생성/조회 API 도입 — 블로커 해제

**현상**: Practice 생성(`POST /practices`) 은 이미 존재하는 `songId` 를 받아야 하고, `PUT /practice-songs/{songId}/ref-link` 는 이미 존재하는 song 에만 동작. 하지만 **song 을 처음부터 등록하는 공식 경로가 없음**. 운영 환경에서는 물론 개발/QA 에서도 첫 Practice 를 만들 방법이 차단됨.

**요청 (권장안, 택 1)**
- **A-1**: `POST /api/v1/practice-songs` (title/artist 필수, refLink 선택) + 응답에 `songId` 반환. 프론트의 "합주 만들기" 폼을 "곡 검색 / 없으면 새로 추가" UX 로 확장 가능.
- **A-2**: `PUT /api/v1/practice-songs/{songId}/ref-link` 를 진짜 upsert 로 변경. 응답 바디에 생성/갱신된 song 정보 포함. (이름과 실 동작 일치)

현재 프론트는 `CreatePracticeRequest.song` 을 UUID 문자열로 받고 있어서, 어느 쪽이든 백엔드가 반환하는 `songId` 를 그대로 전달 가능.

### B. (Backend) `GET /api/v1/practices` 목록 엔드포인트 추가

**현상**: `Allow: POST` 로 GET 미구현 상태. Performance 6-2 는 동일 패턴 목록을 제공하고 있어 Practice 도 동일 스타일로 등재 가능.

**요청 (권장 shape)**
- `GET /api/v1/practices`
- Query: `bandId?`(UUID, 특정 밴드 소속만), `lastId?`(커서), `pageSize?`(기본 10, 1~100)
- Response: `CursorResponse<PracticeListItemResponse, UUID>` — `PracticeListItemResponse` 는 상세(`4-2`) 의 축약본(제목/시작시각/소요분/장소/song 요약) 권장

미구현 상태에서 프론트는 `/practices` 페이지의 `ErrorState` 경로로 폴백하며 `백엔드 목록 엔드포인트가 아직 제공되지 않을 수 있습니다.` 문구를 노출 중.

### C. (Backend) "인증 불필요" API_SPEC 표기와 실제 인가 동작 불일치

**현상**: API_SPEC 4-1 (합주 생성) · 4-2 (합주 상세 조회) · 5-1/5-2 (refLink upsert/delete) 는 모두 **"인증 불필요 (TODO: 인증 추가 예정)"** 라고 명시되어 있으나 실제로는 Bearer 없이는 401.

**요청**: API_SPEC 을 "인증 필요" 로 일괄 갱신 (또는 실제 SecurityFilterChain 을 의도대로 `permitAll()` 정렬). Task 7 리포트의 §3-A 와 동일한 스펙 드리프트 성격.

### D. (Backend, 중기) 일관성 — 미존재 리소스 접근 시 401 대신 404

**현상**: 미구현 경로(예: `GET /api/v1/songs`) 에 Bearer 유효 토큰을 담아 호출해도 401 반환. `WWW-Authenticate` 헤더 없음. 실사용자 관점에서는 "토큰이 왜 거부되지?" 로 혼동 유발.

**요청**: 경로 자체가 없으면 **404 Not Found** 또는 405 Method Not Allowed 로 분기. Task 6 리포트 §3-C 의 "인증 실패 401 / 권한 부족 403 분리" 와 맥락이 비슷한 이슈.

### E. (Frontend, 현재는 무조치) Practice 생성 폼 UX 개선 여지

- 현재 `PracticeCreateForm.client.tsx` 는 `songId` UUID 를 텍스트 입력으로 받고 있음 (hint 로 안내). 백엔드 §3-A 해결 후 "곡 검색/선택" UX 로 교체 예정.
- Session 배정은 API_SPEC 4-6/4-7 이 **본인만 배정/해제 가능**하도록 제한되어 있어 "나를 배정 / 해제" 토글로만 구현. 다른 참여자를 세션에 배정해야 할 요구가 생기면 백엔드에 별도 엔드포인트(예: `PATCH /sessions/{id}/assignment?participantId=...`) 추가 필요.

---

## 4. 검증된 동작 (긍정 신호)

- `POST /api/v1/practices` 의 요청 shape 수용: 프론트가 보낸 `{title, song, venue, startAt(yyyy-MM-dd HH:mm), durationMinutes}` 를 수용해 404(NotFound) 로 진행. 스키마 불일치 400 이 아님 → **요청 형태는 일치**.
- `Authorization: Bearer <token>` 전체 검증 경로 정상 (Task 6/7 에서 지적된 JwtAuthenticationFilter MalformedJwtException 이슈는 여기서도 재발 없음).
- 401 응답은 `WWW-Authenticate: Bearer error="invalid_token"` 헤더 + `{success:false, message, data:null, timestamp}` 표준 바디를 유지 (프론트 `ApiError` 매핑 정상).

---

## 5. 프론트 관련 구현 지점

```text
src/domain/practice/types/{req,res,schema,index}.ts      # DTO + zod 스키마 6개
src/domain/practice/api/*.ts                              # 11개 함수 (createPractice ~ unassignSession)
src/domain/practice/hooks/*.ts                            # 10개 Mutation/Query 훅 (낙관적 업데이트 포함)
src/domain/practice/components/*.tsx                      # PracticeCard / PracticeScheduleBadge / PracticeVenueInline(client) / SessionRow / SessionCreateForm(client) / SongRefLinkEditor(client)
src/domain/practice-song/api/*.ts                         # upsertRefLink / deleteRefLink
src/domain/practice-song/hooks/*.ts                       # useUpsertSongRefLink / useDeleteSongRefLink
src/app/(main)/practices/page.tsx + PracticesList.client.tsx           # 무한 스크롤 목록 + FAB
src/app/(main)/practices/new/page.tsx + PracticeCreateForm.client.tsx  # 생성 폼
src/app/(main)/practices/[practiceId]/page.tsx + PracticeDetailContent.client.tsx  # 상세 (일정/장소/세션/참여자/곡 링크/삭제)
```

§3-A 해결 후 `PracticeCreateForm` 을 "곡 선택 UI" 로 확장하면 외에는 추가 프론트 수정 불필요. §3-B 해결 시 `usePractices` 가 실동작하면서 `/practices` 페이지 EmptyState/정상 목록 분기 모두 검증 가능해짐.

---

## 6. 재현용 페이로드 위치

```text
/tmp/bandage-practice-test/
  ├── state.env       # TOKEN, MEMBER_ID
  ├── join.json / login.json
  ├── cookies.txt
  ├── create.json     # Practice 생성 요청 (song=랜덤 UUID)
  └── ref_link.json   # refLink 업서트 요청
```

---

## 7. 다음 단계 제안

1. 백엔드에 **§3-A (Song 생성 엔드포인트)** 반영 요청. 반영 후 이 리포트에 "2차 검증" 추가하여 Practice/Session/Participant/Schedule/Venue/Delete/RefLink 전 플로우를 확정 검증.
2. 그 전까지 프론트는 현재 구현 그대로 PR 병합하여도 회귀는 없으나 실제 API 호출 경로는 **백엔드 A/B 해제 전까지 사용자에게는 비활성** 에 가까움. PR 본문 및 ROUTES.md 에 "API 의존 대기 중" 명시 권장.
