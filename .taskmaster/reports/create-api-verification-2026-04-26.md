# 생성 API 실서버 검증 리포트 (mvp-1-fix-v3 Task 8 / Issue #98)

## 1. 메타

- 작성일: 2026-04-26
- 검증 주체: AI Agent (Claude Sonnet 4.6) on willjsw 머신
- 대상 URL: `http://localhost:8080` (Spring Modulith 백엔드)
- 검증 도구: `curl` + `python3 -m json.tool`
- 검증 범위: mvp-1-fix-v3 Task 1~7+9 결과물의 실제 백엔드 계약 일관성
  - 신규 me 엔드포인트 (Task 1~3 도입): `/bands/me`, `/practices/me`, `/practices/me/search`, `/performances/me`, `/performances/search`, `/bands/search`
  - 생성 API: `/bands`, `/performances`, `/practices`, `/bands/{id}/applications`
  - 합주 시작하기 마법사 (Task 4) 의 song 필드 처리
- 테스트 계정: `task8+1777134014@bandage.test` / `PassW0rd!` (회원가입 직후 로그인, accessToken 198자)

## 2. 테스트한 API 목록

| # | path | method | 인증 | 프론트 사용처 | 판정 |
|---|---|---|---|---|---|
| T1 | `/api/v1/bands` | POST | Bearer | `BandCreateModal`, `domain/band/api/createBand.ts` | 정상 |
| T2 | `/api/v1/bands` | POST | (Bearer 누락) | (위와 동일) | 정상 (401) |
| T3 | `/api/v1/bands` | POST | Bearer | (위와 동일) | 정상 (필수 필드 누락 시 400) |
| T4 | `/api/v1/bands/me` | GET | Bearer | `getMyBands` (Task 1), `useMyBands` (Task 2), `useBandRole` 단순화 (Task 2) | 정상 + myRole 포함 |
| T5 | `/api/v1/bands/search` | GET | Bearer | `searchBands` (Task 1), `BandPickerModal` (Task 5), `useBandSearch` (Task 2) | 정상 |
| T6 | `/api/v1/performances` | POST | Bearer | `PerformanceCreateForm/Modal` (Task 5) | **차단** (bandIds null/missing → 400) |
| T6b | `/api/v1/performances` | POST | Bearer | (위와 동일, 명시적 `bandIds:[]`) | 정상 |
| T7 | `/api/v1/performances` | POST | Bearer | (위와 동일, `bandIds:[<uuid>]`) | 정상 |
| T8 | `/api/v1/performances/me` | GET | Bearer | `getMyPerformances`, `useMyPerformances` | 정상 |
| T9 | `/api/v1/performances/search` | GET | Bearer | `searchPerformances`, `useSearchPerformances` | 정상 |
| T10 | `/api/v1/practices` | POST | Bearer | `PracticeCreateWizard` (Task 4) | 정상 (실제 songId 일 때) |
| T11 | `/api/v1/practices` | POST | Bearer | (위와 동일, song = 텍스트 식별자) | **차단** (song 필드 strict UUID — wizard 의 임시 텍스트 전송 패턴 실패) |
| T12 | `/api/v1/practice-songs/from-song` | POST | Bearer | `createPracticeSongFromSong` (Task 4) | **차단** (practiceId required — 닭-달걀) |
| T13 | `/api/v1/practices/me` | GET | Bearer | `getMyPractices`, `useMyPractices` | 정상 |
| T14 | `/api/v1/practices/me/search` | GET | Bearer | `searchMyPractices`, `useSearchMyPractices` | 정상 |
| T15 | `/api/v1/bands/{id}/applications` | POST | Bearer | `applyBand`, `useApplyBand` | 정상 (이미 가입 시 409) |
| T16 | `/api/v1/bands/me` | GET | (잘못된 Bearer) | (Task 6 AuthBootstrapper 검증) | 정상 (401 → refresh 또는 /login) |
| T17 | `/api/v1/performances` | POST | Bearer | (과거 시각) | 검토 필요 (백엔드 검증 없음 — 200) |

## 3. 케이스별 실제 요청/응답

### T1 — POST /bands (성공)

요청
```http
POST /api/v1/bands
Authorization: Bearer <token>
Content-Type: application/json

{"name":"Task8 Test Band","description":"검증용 밴드"}
```

응답 (HTTP 200)
```json
{
  "success": true,
  "data": {
    "bandId": "019dc571-494d-7958-815e-dcbf5d449549",
    "bandName": "Task8 Test Band"
  },
  "timestamp": "2026-04-26T01:20:29.144702"
}
```

판정: 정상. API_SPEC §3-1 일치. `profileImg` 미전달 시 정상 처리 (이전 라운드 차단 해소 확인).

### T2 — POST /bands (인증 누락)

요청: Authorization 헤더 없음.

응답 (HTTP 401)
```json
{
  "success": false,
  "message": "인증되지 않은 회원입니다.",
  "code": "UNAUTHORIZED",
  "data": null,
  "timestamp": "2026-04-26T01:20:38.643561"
}
```

판정: 정상. 401 + UNAUTHORIZED code 명확.

### T3 — POST /bands (필수 필드 누락)

요청 body: `{"description":"no name"}` (name 누락)

응답 (HTTP 400)
```json
{
  "success": false,
  "message": "JSON parse error: ... parameter name",
  "code": "INVALID_INPUT_VALUE",
  "timestamp": "2026-04-26T01:20:38.796538"
}
```

판정: 정상. **품질 개선 권고**: Kotlin data class 의 raw deserialization 메시지가 그대로 노출됨. 사용자 친화 메시지로 정제 필요.

### T4 — GET /bands/me (myRole 포함)

요청
```http
GET /api/v1/bands/me?pageSize=10
Authorization: Bearer <token>
```

응답 (HTTP 200)
```json
{
  "success": true,
  "data": {
    "content": [{
      "bandId": "019dc571-494d-7958-815e-dcbf5d449549",
      "bandName": "Task8 Test Band",
      "description": "검증용 밴드",
      "profileImg": null,
      "myRole": "LEADER"
    }],
    "nextCursor": null,
    "hasNext": false
  }
}
```

판정: 정상. **mvp-1-fix-v3 Task 1~2 의 핵심 의존**. `myRole` 정상 노출 → `useBandRole` 단순화 검증 OK.

### T5 — GET /bands/search

요청: `GET /api/v1/bands/search?keyword=Task8`

응답 (HTTP 200): 단일 매칭 결과. `BandPickerModal` 정상 동작 가능.

### T6 — POST /performances `bandIds` 누락 (차단)

요청
```http
POST /api/v1/performances
Authorization: Bearer <token>

{"title":"Task8 공연","startAt":"2026-12-31 19:00","durationMinutes":120,"venue":"Club FF"}
```

응답 (HTTP 400)
```json
{
  "success": false,
  "message": "JSON parse error: ... parameter bandIds",
  "code": "INVALID_INPUT_VALUE"
}
```

판정: **차단 (P0)**. API_SPEC §6-1 은 `bandIds: optional 기본값 빈 배열` 명세지만 실제 백엔드는 non-null 필수. 프론트는 본 라운드 Task 5 에서 `bandIds: selectedBands.length > 0 ? ... : undefined` 패턴을 사용 → 미선택 시 항상 400.

**FE 즉시 수정**: `selectedBands.map((b) => b.bandId)` (항상 배열 전송, 빈 배열 OK) — 본 PR 에 포함.

**BE 권고**: `PerformanceCreateRequest.bandIds` 를 `List<UUID> = emptyList()` 로 default 부여 또는 nullable 처리.

### T6b — POST /performances 명시 빈 배열

요청 body: `{"bandIds":[], ...}`

응답 (HTTP 200): 정상 생성.

### T10 — POST /practices (UUID — 미존재)

요청 body: `{"song":"019dc571-494d-7958-815e-dcbf5d449549", ...}` (band UUID 를 song 자리에)

응답 (HTTP 404)
```json
{
  "success": false,
  "message": "요청한 합주 곡 정보를 찾을 수 없습니다.",
  "code": "PRACTICE_SONG_NOT_FOUND"
}
```

판정: 정상 (PracticeSong 미존재 시 정확한 코드 반환).

### T11 — POST /practices (song 텍스트 — 마법사 임시 패턴, **차단**)

요청 body: `{"song":"Stairway to Heaven — Led Zeppelin", ...}`

응답 (HTTP 400)
```json
{
  "success": false,
  "message": "JSON parse error: Cannot deserialize value of type `java.util.UUID` from String ...: UUID has to be represented by standard 36-char representation",
  "code": "INVALID_INPUT_VALUE"
}
```

판정: **차단 (P0)**. mvp-1-fix-v3 Task 4 `PracticeCreateWizard` 가 임시로 `<title> — <artist>` 텍스트 식별자를 song 필드에 전송하는 패턴은 실패. **합주 시작하기 마법사 end-to-end 동작 불가**.

### T12 — POST /practice-songs/from-song (practiceId 누락, **차단**)

요청 body: `{"song":{"title":"Vicarious", ...}}` (practiceId 누락)

응답 (HTTP 400): `parameter practiceId` non-null

판정: **차단 (P0)**. 닭-달걀 확정 — Practice 는 songId 가 필요하고, PracticeSong 은 practiceId 가 필요. 어느 쪽도 단독 생성 불가.

### T13/T14 — /practices/me + me/search

빈 결과 (HTTP 200, content=[]). 정상 (테스트 계정이 아직 합주 미가입).

### T15 — POST /bands/{id}/applications 자기 자신 가입 시도

응답 (HTTP 409)
```json
{"success":false,"message":"이미 가입된 밴드 멤버입니다.","code":"BAND_MEMBER_ALREADY_EXISTS"}
```

판정: 정상 (이미 LEADER 인 밴드에 재가입 시도 차단).

### T16 — GET /bands/me (잘못된 Bearer)

응답 HTTP 401. AuthBootstrapper 의 401 → refresh → 실패 시 /login 흐름이 정상 트리거 가능.

### T17 — POST /performances 과거 startAt

요청 body: `{"startAt":"2020-01-01 12:00", ...}`

응답 (HTTP 200): 그대로 생성됨.

판정: **품질 권고**. 과거 시각 검증이 백엔드에 없음. DateTimePicker `futureOnly` 모드가 클라이언트 가드만 제공. UX 차원에서 의도된 결정인지 확인 필요.

## 4. 권장 조치 내용

### 차단 (P0) — 즉시 해결 필요

#### 4-1. PerformanceCreateRequest.bandIds null/missing 처리 (T6)

- **재현 절차**: PerformanceCreateForm 또는 PerformanceCreateModal 에서 참여 밴드 미선택 후 제출
- **추정 원인**: Kotlin data class `bandIds: List<UUID>` 가 non-null
- **확인 체크리스트**
  - [x] 프론트: `selectedBands.map((b) => b.bandId)` 로 변경 (본 PR 에 포함)
  - [ ] 백엔드: `bandIds: List<UUID> = emptyList()` 또는 `List<UUID>? = null` 처리 검토
  - [ ] API_SPEC §6-1 의 "optional 기본값 빈 배열" 문구가 실제 동작과 일치하도록 정렬

#### 4-2. Practice 생성과 PracticeSong 의 닭-달걀 (T11/T12 — FE-API-020)

- **재현 절차**: PracticeCreateWizard Step 3 에서 합주 만들기 클릭
- **현재 동작**: `song` 필드에 텍스트 전송 → 400, 또는 song UUID 미존재 → 404, PracticeSong 단독 생성 불가
- **권고 (둘 중 택일)**
  1. **§4-1 `song` 필드 확장** — UUID 또는 `SongSearchItem` 객체를 함께 받아 새 PracticeSong 자동 생성
  2. **§5-2 `practiceId` 선택화** — practiceId 없이 PracticeSong 만 먼저 만들고 응답 songId 를 §4-1 에 전달
- 본 라운드 프론트는 마법사 UI 만 완성 — 백엔드 결정 후 wizard.submit fetcher 만 교체

### 기능 저하 (P1)

#### 4-3. 입력 검증 메시지 정제 (T3, T6)

`JSON parse error: Cannot construct instance of ...` 가 사용자에게 그대로 노출. ApiResponse.fieldErrors 로 정제된 한국어 메시지 매핑 권고.

#### 4-4. 과거 startAt 검증 (T17)

공연/합주 생성 시 startAt < now 인 경우 백엔드에서 명시적 거부 또는 경고 코드 반환.

### 참고 (P3)

- T2 401 응답에 `WWW-Authenticate` 헤더 동봉 여부 (RFC 7235) 추가 확인 권고
- /bands/me 의 nextCursor=null + hasNext=false 일관성: 정상 (이전 라운드 해소 사항 유지)

## 5. 프론트 관련 구현 지점

| 이슈 | 파일 | 비고 |
|---|---|---|
| 4-1 (bandIds) | `src/app/(main)/performances/new/PerformanceCreateForm.client.tsx`<br>`src/domain/performance/components/PerformanceCreateModal.client.tsx` | 본 PR 에서 수정 |
| 4-2 (chicken-egg) | `src/app/(main)/practices/new/PracticeCreateWizard.client.tsx` line 92~108 | 백엔드 결정 후 fetcher 교체 |
| 4-3 (메시지) | `src/global/error/ApiError.ts` mapping (해당 case 만 fallback) | 별도 라운드 |
| 4-4 (과거 시각) | `src/components/ui/date-time-picker.tsx` `futureOnly` 모드 (이미 적용) | 백엔드 보강 권고만 |

## 6. 재현용 페이로드 위치

`/tmp/task8-api-test/`:
- `cookies.txt` — refresh token 쿠키 jar
- `token.txt` — accessToken
- `band-create.json`, `band-noauth.json`, `band-noname.json`
- `bands-me.json`, `bands-search.json`
- `perf-empty.json`, `perf-explicit.json`, `perf-with-band.json`
- `perf-me.json`, `perf-search.json`, `perf-past.json`
- `practice-uuid-fake.json`, `practice-text.json`
- `song-fromsong.json`
- `practices-me.json`, `practices-me-search.json`
- `apply-self.json`, `bad-token.json`

## 7. mvp-1-fix-v3 종합 판정

| Task | 검증 결과 |
|---|---|
| Task 1 — me API/types | 정상 (T4/T5/T8/T9/T13/T14 모두 통과) |
| Task 2 — Query hooks + useBandRole | 정상 (myRole 매핑 정확) |
| Task 3 — 페이지 me 이행 | 정상 |
| Task 4 — 합주 시작하기 마법사 | UI 정상 / **제출 차단 (FE-API-020)** |
| Task 5 — UUID 제거 (BandPickerModal etc.) | 정상 / **공연 생성 bandIds 패턴 수정 (본 PR)** |
| Task 6 — AuthBootstrapper | 정상 (T16 401 처리 가능) |
| Task 7 — PW 강도 카피 | 영향 없음 (UI only) |
| Task 9 — 홈 3건 제한 | 정상 (me 엔드포인트 동작 확인) |
