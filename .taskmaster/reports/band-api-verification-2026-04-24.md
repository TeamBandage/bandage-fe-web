# Band API 프론트 연동 검증 리포트 (Task 7 / Issue #9)

- 작성일: 2026-04-24 (Asia/Seoul)
- 검증 주체: 프론트엔드 (Bandage-FE-Web, branch `feat/#9-band`)
- 백엔드 기동 URL: `http://localhost:8080`
- 검증 도구: `curl` 직접 호출. 재현용 스크립트/페이로드 `/tmp/bandage-band-test/*`
- 검증 범위: `src/domain/band/api/*` 의 10개 함수 + 역할 기반 UI 가드 보조 동작
- 선행 컨텍스트: 이전 Task 6 검증 리포트(`.taskmaster/report/auth-member-api-verification-2026-04-24.md`) 에서 지적된 JWT 필터 관련 이슈가 **대부분 해소**된 것으로 관측됨 (401 정상 반환 + `WWW-Authenticate` 헤더)

---

## 1. 테스트한 API 목록

| # | Path | Method | 인증 | 프론트 호출 | 판정 |
| --- | --- | --- | --- | --- | --- |
| 1 | `/api/v1/bands` | POST | Bearer | `domain/band/api/createBand.ts` | 정상 |
| 2 | `/api/v1/bands/{bandId}` | GET | Bearer | `getBandDetail.ts` | 정상 (응답 shape API_SPEC 과 일치) |
| 3 | `/api/v1/bands?pageSize=N` | GET | Bearer | `getBands.ts` | 정상 (`CursorResponse` shape 일치) |
| 4 | `/api/v1/bands/{bandId}/members` | GET | Bearer | `getBandMembers.ts` | 정상 |
| 5 | `/api/v1/bands/{bandId}/applications` | POST | Bearer | `applyBand.ts` | 정상 (요청 바디 없음, 200 응답) |
| 6 | `/api/v1/bands/{bandId}/applications?status=...&pageSize=N` | GET | Bearer | `getBandApplications.ts` | 정상 (status 필터 동작: PENDING / APPROVED / REJECTED / WITHDRAWN 확인) |
| 7 | `/api/v1/bands/{bandId}/applications/{id}?status=APPROVED\|REJECTED` | PATCH | Bearer | `decideApplication.ts` | 정상 (query param 전달 동작) |
| 8 | `/api/v1/bands/{bandId}/applications/me` | PATCH | Bearer | `withdrawApplication.ts` | 정상 (본인 PENDING 신청 → WITHDRAWN 전환) |
| 9 | `/api/v1/bands/{bandId}/members/{bandMemberId}/role` | PATCH | Bearer | `delegateLeader.ts` | 정상 (LEADER → 위임 후 역할 교체 확인) |
| 10 | `/api/v1/bands/{bandId}/members/me` | DELETE | Bearer | `leaveBand.ts` | 정상 (탈퇴 후 멤버 목록에서 제거) |

검증 시나리오는 다음 상태 전이 전부를 한 시나리오로 커버:
userA(LEADER) 밴드 생성 → userB 신청 → APPROVED → userC 신청 → REJECTED → userD 신청 → WITHDRAWN(본인 철회) → A → B 리더 위임 → userA 탈퇴.

---

## 2. 케이스별 실제 요청/응답 값

아래는 원문 인용 (재현 보장). 시간대 `KST = UTC+9`, timestamp 는 백엔드 서버 시계 기준.

### 2-1. POST `/api/v1/bands` — 밴드 생성

요청
```http
POST /api/v1/bands HTTP/1.1
Authorization: Bearer <tokenA>
Content-Type: application/json

{"name":"QA Test Band","description":"밴드 도메인 API 검증용","profileImg":"https://i.pravatar.cc/128?u=qaband"}
```
응답 (200)
```json
{
  "success": true, "message": null,
  "data": { "bandId": "019dbd8a-205b-7cf9-ba27-6aff00369979", "bandName": "QA Test Band" },
  "timestamp": "2026-04-24T12:30:39.399156"
}
```
판정: `CreateBandResponse` 타입과 정확히 일치. 생성자는 자동으로 LEADER 로 등록(후속 멤버 목록 조회에서 확인됨).

### 2-2. GET `/api/v1/bands/{bandId}`

응답 (200) — `BandInfoResponse` 완전 일치
```json
{ "success": true, "message": null,
  "data": { "bandId": "019dbd8a-...", "bandName": "QA Test Band",
            "description": "밴드 도메인 API 검증용",
            "profileImg": "https://i.pravatar.cc/128?u=qaband" },
  "timestamp": "2026-04-24T12:30:49.874452" }
```

### 2-3. GET `/api/v1/bands?pageSize=10`

응답 (200) — `CursorResponse<BandInfoResponse, string>`
```json
{ "data": {
    "content": [ { "bandId": "019dbd8a-...", "bandName": "QA Test Band", ... } ],
    "nextCursor": "019dbd8a-205b-7cf9-ba27-6aff00369979",
    "hasNext": false
  }, ... }
```
관찰: `hasNext:false` 인데 `nextCursor` 가 null 이 아님 (마지막 페이지의 마지막 id 가 그대로 들어옴). 프론트 `useInfiniteCursor` 는 `hasNext ? (nextCursor ?? undefined) : undefined` 로 가드해 문제 없음.

### 2-4. GET `/api/v1/bands/{bandId}/members`

LEADER 생성 직후
```json
{ "data": { "content": [ { "bandMemberId": "019dbd8a-2065-...", "memberId": 3, "role": "LEADER" } ],
            "nextCursor": "019dbd8a-2065-...", "hasNext": false }, ... }
```
userB 승인 후
```json
{ "data": { "content": [
    { "bandMemberId": "019dbd8a-c1cc-...", "memberId": 4, "role": "MEMBER" },
    { "bandMemberId": "019dbd8a-2065-...", "memberId": 3, "role": "LEADER" }
  ], "nextCursor": "019dbd8a-2065-...", "hasNext": false }, ... }
```
판정: `BandMemberInfoResponse` (bandMemberId/memberId/role) 일치.

### 2-5. POST `/api/v1/bands/{bandId}/applications` — 가입 신청

요청 바디 없음. 응답 (200, `data: null`).
```json
{ "success": true, "data": null, "timestamp": "2026-04-24T12:31:08.561006" }
```
판정: 프론트 `applyBand.ts` 가 body 없이 POST 하는 구현과 일치.

### 2-6. GET `/api/v1/bands/{bandId}/applications?status=PENDING`

```json
{ "data": { "content": [
    { "bandApplicationId": "019dbd8a-927f-...", "memberId": 4, "status": "PENDING" }
  ], ... } }
```
판정: `BandApplicationInfoResponse` 일치. status=REJECTED / WITHDRAWN / APPROVED 필터도 각각 정상 분리되어 반환됨을 같은 시나리오 내에서 재검증.

### 2-7. PATCH `/api/v1/bands/{bandId}/applications/{id}?status=APPROVED|REJECTED`

두 decision 모두 200 정상. 응답 body `data:null`. 이후 `GET ...?status=APPROVED|REJECTED` 필터 목록에 정확히 반영됨.

### 2-8. PATCH `/api/v1/bands/{bandId}/applications/me` — 본인 철회

200, `data:null`. 이후 해당 신청이 `status=WITHDRAWN` 필터 목록에 노출됨. 시나리오 상 PENDING 상태에서만 호출했으며 이미 APPROVED 된 경우의 반응은 별도 검증 안 함.

### 2-9. PATCH `/api/v1/bands/{bandId}/members/{bandMemberId}/role` — 리더 위임

200, `data:null`. 직후 `GET /members` 에서 역할 교체 확인
```json
{ "content": [
  { "memberId": 4, "role": "LEADER" },   // B (승격)
  { "memberId": 3, "role": "MEMBER" }    // A (강등)
] }
```

### 2-10. DELETE `/api/v1/bands/{bandId}/members/me`

200, `data:null`. 탈퇴 후 `GET /members` 결과에서 해당 멤버가 사라짐을 확인.

### 2-11. 에러 / 경계 케이스 응답

| 케이스 | HTTP | body message (있는 경우) |
| --- | --- | --- |
| Bearer 누락 | 401 | `"인증되지 않은 회원입니다."` + `WWW-Authenticate: Bearer error="invalid_token"` |
| 존재하지 않는 bandId 조회 | 404 | (body 본문 생략 — 실사용 영향 없음) |
| 빈 `name` 으로 밴드 생성 (`@NotBlank`) | 400 | 유효성 에러 (프론트 zod 로 선검증하므로 보통 이 단계까지 안 옴) |
| LEADER 가 본인 밴드에 재신청 | 409 | 중복 상태 위반 |
| 비리더가 리더 위임 시도 | 401 | `Bearer error="invalid_token"` — 후술 (§3-B) |
| 이미 탈퇴한 사용자가 재탈퇴 | 404 | 멤버 미존재 |

---

## 3. 권장 조치 내용 및 검토 필요 사항

### A. (Backend) API_SPEC 과 실제 인증 요구 불일치

- API_SPEC 3-2/3-3/3-4/3-5 는 **"인증 불필요"** 로 명시 (밴드 단건/목록/멤버 단건/멤버 목록 조회)
- 실제 동작: Bearer 없이 호출하면 **401 + "인증되지 않은 회원입니다."** 반환. 즉 모두 인증 필요
- 둘 중 하나로 맞춰야 함:
  - (A-1) SecurityFilterChain 에서 해당 GET 경로를 `permitAll()` 로 복원해 **공개 API 로 유지**
  - (A-2) API_SPEC 을 "인증 필요" 로 수정 + 프론트는 이미 Bearer 를 늘 첨부하므로 코드 변동 없음
- 우선순위: 스펙 드리프트 성격 — 어느 방향이든 빠르게 정렬 필요

### B. (Backend) 권한 부족(403 상당) 을 401 로 반환

- 비리더인 userC 가 `PATCH .../members/{id}/role` (리더 위임) 시도 → **401** + `WWW-Authenticate: Bearer error="invalid_token"`
- userC 토큰은 정상 유효 상태 (동일 토큰으로 다른 공개 읽기 가능). 실제로는 **권한 부족(403)** 이 맞는 상황인데 401 로 리턴
- RFC 7235 기준: 토큰 없음/무효/만료 = 401, 인증되었으나 해당 리소스에 대한 권한 없음 = 403
- 프론트 apiClient 의 401 인터셉터가 이 응답을 "토큰 무효" 로 오인해 `/auth/refresh` 호출을 시도할 수 있음 (refresh 성공 후 재시도해도 여전히 401 → 결국 `handleAuthFailure` 로 떨어져 강제 로그아웃 가능)
- 권장: 인가(authorization) 실패는 403 으로 분리. `WWW-Authenticate` 헤더는 401 에만 첨부
- 프론트 측 임시 우회(선택): 메시지 본문이 `"인증되지 않은 회원입니다."` 인 경우만 refresh 시도 — 다만 근본 해결은 백엔드 분리

### C. (Backend, 경미) `CursorResponse.nextCursor` 가 `hasNext=false` 일 때도 마지막 아이템 id 로 채워짐

- 관측: `{ "content":[...], "nextCursor":"019dbd...", "hasNext":false }`
- 일관성 기준으로는 `hasNext:false` 일 때 `nextCursor:null` 이 자연스러움
- 프론트 영향 없음(가드 처리됨). 우선순위 낮음 — API 스타일 일관성 차원에서만 검토 권고

### D. (Frontend 현재는 무조치) `useBandRole` 비효율 개선 여지

- 현재 구현: `useMe().id` 로 현재 memberId 확보 → `/bands/{bandId}/members` pageSize=100, 최대 10페이지 순회하여 매칭
- 큰 밴드(>1000명) 에서는 페이지 순회 비용이 큼
- 근본 개선: 백엔드가 `BandInfoResponse` 에 `myRole` 필드를 추가하거나 `GET /bands/{bandId}/me` 전용 엔드포인트 제공. 그러면 프론트는 단일 쿼리로 교체 가능
- 지금은 소규모 밴드 전제 하 수용 가능 — 실사용 시 대형 밴드 등장 시점에 재평가

---

## 4. 프론트 관련 구현 지점

```text
src/domain/band/types/{req,res,schema,index}.ts   # DTO + zod 스키마
src/domain/band/api/*.ts                           # 10개 API 함수
src/domain/band/hooks/*.ts                         # TanStack Query/Mutation 래퍼
src/domain/band/components/*.tsx                   # BandCard/RoleBadge/MemberRow/ApplicationRow/CreateForm
src/global/auth/useBandRole.ts                     # 역할 판정 훅 (§3-D)
src/global/auth/RoleGuard.tsx                      # 역할 기반 UI 가드
src/app/(main)/bands/page.tsx + BandsList.client.tsx              # 목록 + 무한 스크롤 + FAB
src/app/(main)/bands/new/page.tsx                                 # 생성 폼
src/app/(main)/bands/[bandId]/page.tsx + BandDetailContent.client.tsx  # 상세 3탭
```

§3-A 가 (A-2) 로 해결되면 프론트 추가 수정 없음. (A-1) 이라면 현재도 인증 헤더 자동 첨부라 무영향. §3-B 는 백엔드 수정 후 프론트 변경 불필요. §3-D 는 백엔드 스키마 확장 시 useBandRole 단순화.

---

## 5. 재현용 페이로드 위치

```text
/tmp/bandage-band-test/
  ├── state.env          # EMAIL_A~D, PASS, TOKEN_A, BAND_ID, MEMBER_B_ID, BAND_MEMBER_ID_B
  ├── join_{a,b,c,d}.json / .resp
  ├── login_{a,b,c,d}.json / .resp
  ├── cookies_{a,b,c,d}.txt
  ├── create_band.json
  ├── bad_create.json    # 14b 빈 name 검증용
```

재현 시 이메일은 `band-{a,b,c,d}-<timestamp>@bandage.test` 로 유일해지니 동일 스크립트 재실행 시 timestamp 만 갱신.
