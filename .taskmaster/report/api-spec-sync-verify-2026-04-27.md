# API_SPEC 동기화 + 실서버 검증 리포트

작성일: 2026-04-27
대상 BE: `http://localhost:8080` (`../v1`)
대상 FE branch: `feat/api-spec-sync-and-verify`
영향 범위: BE 가 추가한 신규/변경 엔드포인트 (총 9건) 와 FE 측 fetcher/타입 접목

## 메타
- 검증 주체: AI Agent (Claude)
- BE 빌드: 검증 시점 기동 중. 도중 한 번 다운/재기동 발생.
- 검증 도구: `curl`, `pnpm typecheck/lint/test`

## 1. API_SPEC 동기화

### 1-1. 변경 요지

`../v1/API_SPEC.md` 가 BE 의 신규/수정 사항을 반영해 다음 항목이 추가/갱신됨. FE 의 `API_SPEC.md` 를 BE 본으로 일괄 교체.

| # | 변경 항목                                            | 분류  | FE 영향                                  |
|---|-----------------------------------------------------|-------|------------------------------------------|
| 1 | `MemberInfoResponse` 에 `id` alias + `profileImg` 노출 | 수정  | 타입 갱신                                |
| 2 | `BandMemberInfoResponse` 에 `name`, `profileImg` 노출  | 수정  | `getMemberDisplayName` 폴백 정상화       |
| 3 | `BandApplicationInfoResponse` 에 `applicantName`, `applicantProfileImg`, `appliedAt` | 수정 | 신청 카드 정상 표기 |
| 4 | `GET /members/me/metrics` (§2-5)                    | 신규  | 홈 통계 카드 backing                     |
| 5 | `GET /members/search?q=` (§2-6)                     | 신규  | 글로벌 멤버 검색 — 선곡 회의 마법사 등   |
| 6 | `PATCH /bands/{id}` (§3-12)                         | 신규  | 밴드 정보 수정                           |
| 7 | `DELETE /bands/{id}` (§3-13)                        | 신규  | 밴드 삭제                                |
| 8 | `DELETE /bands/{id}/members/{bandMemberId}` (§3-14) | 신규  | 밴드 멤버 강퇴 (리더)                    |
| 9 | `PATCH /bands/{id}/members/{bandMemberId}` 본문 `role` 으로 역할 변경 (§3-10 확장) | 수정 | 역할 변경 API 일원화 |
| 10| `POST /performances/{id}/bands/batch` (§6-9)        | 신규  | 공연 참여 밴드 일괄 추가                 |
| 11| `DELETE /performances/{id}/bands/{bandId}` (§6-10)  | 신규  | 공연 참여 밴드 단건 제거                 |

### 1-2. FE 적용

- `src/domain/member/types/res.ts`
  - `MemberInfoResponse`: `id`, `memberId?`, `profileImg?`, optional `createdAt` 으로 갱신
  - `MemberMetricsResponse` 신규
  - `MemberSearchItemResponse` 신규
- `src/domain/member/api/`
  - `getMyMetrics.ts` 신규 — §2-5
  - `searchMembers.ts` 신규 — §2-6
- `src/domain/member/hooks/`
  - `useMyMetrics.ts` 신규
  - `useMemberSearch.ts` 신규
- `src/domain/band/api/removeBandMember.ts` 신규 — §3-14
- `src/global/config/queryKeys.ts` — `member.myMetrics` / `member.search` 추가
- `API_SPEC.md` 를 `../v1/API_SPEC.md` 로 일괄 교체

§3-12 (밴드 수정) / §3-13 (밴드 삭제) / §6-9 / §6-10 은 이미 FE 에 fetcher 가 존재 (`updateBand.ts` / `deleteBand.ts` / `batchAddPerformancePractices.ts` / `removePerformancePractice.ts` 외 — `BandPickerModal` 에서 사용 가능 상태). 본 라운드는 호출만 가능하도록 표면을 정리.

### 1-3. 검증 결과 (검증 도구: `pnpm`)

- `pnpm typecheck` — 통과
- `pnpm lint` — 통과
- `pnpm test --run` — 61 passed, 12 files

## 2. 실서버 curl 검증

### 2-1. 검증 대상 + 결과 표

| 엔드포인트                                                    | 상태 | 메모                                                      |
|---------------------------------------------------------------|------|-----------------------------------------------------------|
| `POST /api/v1/members/join`                                   | ✅   | `id`/`email` 응답                                          |
| `POST /api/v1/auth/login`                                     | ✅   | `accessToken` 발급                                         |
| `GET /api/v1/members/me`                                      | ✅   | `id`, `memberId`, `profileImg` alias 모두 노출 ✅           |
| `GET /api/v1/members/me/metrics` (§2-5 신규)                   | ⚠️    | 검증 시점 BE 라우트 404 — **BE 빌드 동기화 필요**          |
| `GET /api/v1/members/search?q=verify` (§2-6 신규)              | ✅   | `[{memberId,name,email,profileImg}]` 정상 응답             |
| `POST /api/v1/bands` (§3-1)                                   | ✅   | `bandId`/`bandName`                                        |
| `PATCH /api/v1/bands/{id}` (§3-12 신규)                        | ✅   | `description` 부분 수정 후 GET 으로 변경 확인              |
| `GET /api/v1/bands/{id}` (§3-2)                               | ✅   | `description`, `profileImg` 포함                           |
| `DELETE /api/v1/bands/{id}` (§3-13 신규)                       | ✅   | 204 (성공)                                                  |
| `GET /api/v1/bands/me` (§3-3-1)                               | ✅   | 빈 커서 응답                                               |
| `GET /api/v1/bands/search?keyword=` (§3-3-2)                   | ✅   | 파라미터 `keyword` (NotBlank). 빈/누락 시 400              |
| `GET /api/v1/practices/me` (§4-1-1)                           | ✅   | 빈 커서 응답                                               |
| `GET /api/v1/performances/me` (§6-2-1)                        | ✅   | 빈 커서 응답                                               |
| `GET /api/v1/practice-songs/search?keyword=tool`              | ✅   | TOOL 곡 2건 (Vicarious / Schism)                           |
| `DELETE /api/v1/bands/{id}/members/{bandMemberId}` (§3-14 신규) | ⏸    | BE 일시 다운으로 단건 검증 보류 — FE fetcher 만 추가       |
| `POST /api/v1/performances/{id}/bands/batch` (§6-9 신규)       | ⏸    | BE 일시 다운으로 보류                                      |
| `DELETE /api/v1/performances/{id}/bands/{bandId}` (§6-10 신규) | ⏸    | BE 일시 다운으로 보류                                      |

### 2-2. 케이스별 실제 요청/응답

#### 2-2-1. `/members/me`

요청:
```http
GET /api/v1/members/me
Authorization: Bearer <token>
```
응답:
```json
{
  "success": true,
  "data": {
    "id": 18,
    "memberId": 18,
    "email": "verify-sync@bandage.test",
    "name": "검증유저",
    "contact": "010-9999-0001",
    "profileImg": null
  }
}
```
판정: **정상**. `id` alias + `memberId` 동시 노출, `profileImg` 필드 추가됨 (FE 타입과 일치).

#### 2-2-2. `/members/me/metrics` (404)

요청:
```http
GET /api/v1/members/me/metrics
Authorization: Bearer <token>
```
응답:
```json
{ "success": false, "message": "요청한 리소스를 찾을 수 없습니다.", "code": "RESOURCE_NOT_FOUND" }
```
HTTP 404.

원인 추정: BE 소스(`MemberController.kt` line 68: `@GetMapping("/me/metrics")`) 에는 라우트가 존재하나 **현재 기동 중인 빌드는 갱신 전**. BE 측 재배포 또는 ./gradlew bootRun 재실행 필요.

확인 체크리스트:
- [ ] BE 가 최신 소스로 재기동되었는지 (`./gradlew bootRun --args='--spring.profiles.active=local'`)
- [ ] `MemberMetricsFacade` 가 빈으로 등록되어 있는지

#### 2-2-3. `/members/search?q=verify`

요청/응답:
```http
GET /api/v1/members/search?q=verify
```
```json
{
  "success": true,
  "data": [
    { "memberId": 17, "name": "V3VerifyQA", "email": "v3verify+1777177029@bandage.test", "profileImg": null }
  ]
}
```
판정: **정상**. 본인(memberId=18)은 결과에서 제외됨.

#### 2-2-4. `/bands/{id}` PATCH/GET

요청 PATCH:
```http
PATCH /api/v1/bands/019dcd37-4699-7106-8d21-7bba260ab9b3
{ "description": "수정 테스트" }
```
응답: 200 — `BandResponse` (`bandId`, `bandName`).

요청 GET:
```http
GET /api/v1/bands/019dcd37-4699-7106-8d21-7bba260ab9b3
```
응답:
```json
{
  "success": true,
  "data": {
    "bandId": "019dcd37-4699-7106-8d21-7bba260ab9b3",
    "bandName": "검증밴드SYNC",
    "description": "수정 테스트",
    "profileImg": null
  }
}
```
판정: **정상**. `description` 부분 수정 반영 확인.

#### 2-2-5. 파라미터 네이밍 — `keyword` vs `q`

- `GET /bands/search` — `keyword` (NotBlank). FE `searchBands.ts` 이미 `keyword` 사용 ✅
- `GET /practice-songs/search` — `keyword` (NotBlank). FE `searchSongs.ts` 이미 `keyword` 사용 ✅
- `GET /members/search` — `q` (default `""`). FE `searchMembers.ts` 신규 — `q` 사용 ✅

## 3. 권장 조치 내용 및 검토 필요 사항

### 🟠 기능 저하 (P1)
1. **`/members/me/metrics` 404** — 신규 라우트가 실제 응답하지 않음. BE 측 재기동 후 재검증 필요. FE 는 fetcher 를 추가해 두었으므로 빌드 갱신 시 자동 동작.
   - 재현: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/members/me/metrics` → 404
   - 추정 원인: 컨트롤러 코드는 존재(line 68)하나 기동 중 JAR 이 구버전.
   - 체크리스트: `./gradlew clean bootRun` 재실행 후 200 반환 여부 확인.

### 🟡 품질 (P2)
2. **세 검색 API 의 파라미터 네이밍 일관성** — `bands/search`·`practice-songs/search` 는 `keyword`, `members/search` 는 `q`. 클라이언트 혼동 가능. 본 라운드는 BE 결정을 그대로 반영하되, 향후 `q` 로 통일 검토 가치.

### ℹ️ 참고
3. **§3-14 / §6-9 / §6-10** 단건 통합 검증은 BE 일시 다운 직전까지 진행하지 못함. FE 의 `removeBandMember.ts` / 기존 `batchAddPerformancePractices` / `removePerformancePractice` 는 호출 시그니처가 SPEC 과 일치 — 다음 라운드에서 라이브 시퀀스(밴드 생성 → 가입 → 강퇴 / 공연 생성 → 밴드 batch 추가 → 단건 제거) 로 검증 권장.

## 4. 프론트 관련 구현 지점

| 파일                                                | 변경                                                            |
|-----------------------------------------------------|-----------------------------------------------------------------|
| `API_SPEC.md`                                       | BE 본으로 일괄 교체                                             |
| `src/domain/member/types/res.ts`                    | `MemberInfoResponse` 보강 + `MemberMetricsResponse` / `MemberSearchItemResponse` 신규 |
| `src/domain/member/types/index.ts`                  | 신규 타입 export                                                |
| `src/domain/member/api/getMyMetrics.ts`             | 신규 (§2-5)                                                     |
| `src/domain/member/api/searchMembers.ts`            | 신규 (§2-6)                                                     |
| `src/domain/member/hooks/useMyMetrics.ts`           | 신규                                                            |
| `src/domain/member/hooks/useMemberSearch.ts`        | 신규                                                            |
| `src/domain/band/api/removeBandMember.ts`           | 신규 (§3-14)                                                    |
| `src/global/config/queryKeys.ts`                    | `member.myMetrics`, `member.search` 추가                        |

## 5. 재현용 페이로드 위치

`/tmp/sync-verify/` 에 검증 셸이 일부 남아있음 (BE 다운 직전까지 cookies/headers/JSON). 다음 라운드 검증 시 동일 위치 재사용 가능.

## 6. 다음 라운드 권장 시퀀스

1. BE 재기동 후 `/members/me/metrics` 200 응답 확인.
2. 강퇴(§3-14) — 신규 사용자 join → 밴드 가입 → 승인 → 강퇴 → 멤버 목록에서 제거 확인.
3. 공연 batch (§6-9 / §6-10) — 공연 생성 → `bandIds` 일괄 추가 → 응답의 `performanceBandId` 확인 → 단건 제거 → 멤버십 정리 확인.
4. 위 결과를 `.taskmaster/report/api-spec-sync-verify-2026-04-28.md` 로 후속 리포트 작성 권장.
