# MVP 1차 보정 — 실서버 연동 검증 리포트

## 메타
- 작성일: 2026-04-25
- 백엔드 URL: http://localhost:8080
- 검증 주체: Frontend (develop 브랜치, Task 1~14 반영 상태)
- 검증 도구: curl (일부 시나리오는 Claude Code 권한 정책으로 조기 중단)
- 테스트 계정: `intg-<timestamp>@bandage.com` (T1234!)

## 시나리오별 요약

| # | 시나리오 | 엔드포인트 | 결과 | 메모 |
|---|---|---|---|---|
| 1 | 회원가입 | POST /api/v1/members/join | 성공 (200) | `{success:true, data:{id, email}}` |
| 2 | 로그인 | POST /api/v1/auth/login | 성공 (200) | `accessToken` 198자 Bearer |
| 3 | 내 정보 조회 | GET /api/v1/members/me | 성공 (200) | 필드: `memberId`/`email`/`name`/`contact` — 프론트 타입 `id` 와 불일치 (차단) |
| 4 | 밴드 생성 | POST /api/v1/bands | 실패 (400) | `profileImg` 필수 — 프론트는 optional 로 취급 (차단) |
| 5 | 밴드 목록 | GET /api/v1/bands | 성공 (200) | 커서 페이징 정상 |
| 6 | 합주 목록 | GET /api/v1/practices | 실패 (405) | "지원하지 않는 HTTP 메서드" — 프론트 `usePractices` 가 호출 중인 엔드포인트가 백엔드에 정의되지 않음 (🔴 차단) |
| 7 | 공연 목록 | GET /api/v1/performances | 성공 (200) | 빈 content 정상 |
| 8 | 회원가입→로그인→마이페이지 → (이후 시나리오 미완) | — | 부분 성공 | 대량 POST 권한 차단으로 합주/공연 생성, 세션 편성 케이스는 미수행 |

## 성공·실패 상세

### 3) /members/me 응답 필드 불일치 (🔴 차단)
```json
{"memberId":13,"email":"intg-...@bandage.com","name":"검증테스트","contact":"010-1234-5678"}
```
- 프론트 `MemberInfoResponse` 는 `id: number` 필드로 정의돼 있으나 백엔드는 `memberId` 로 반환.
- 영향: `useMe()` 결과를 `id` 로 접근하는 코드(있는 경우) 는 undefined 반환.
- **조치 제안**: 프론트 타입 `MemberInfoResponse.id` → `memberId` 리네이밍 or 백엔드 field 를 `id` 로 통일.

### 4) POST /bands 가 `profileImg` 필수 (🔴 차단)
```json
{"success":false,"message":"JSON parse error: ... problem: Parameter specified as non-null is null: method com.bandage.v1.domain.band.dto.req.BandCreateRequest.<init>, parameter profileImg"}
```
- 프론트 `CreateBandRequest` 는 `profileImg?: string` (optional), 백엔드 Kotlin data class 는 nullable 미허용.
- **조치 제안**: 백엔드 `BandCreateRequest.profileImg` 를 `String?` 로 변경하거나, 프론트에서 빈 문자열/기본 placeholder 전송.

### 6) GET /practices 가 405 (🔴 차단)
```json
{"success":false,"message":"지원하지 않는 HTTP 메서드입니다. (요청 메서드: GET)"}
```
- 프론트 `usePractices` 가 `GET /api/v1/practices?lastId=&pageSize=` 로 목록을 요청하는데 백엔드에는 `POST /practices` (생성) 만 등록돼 있는 것으로 추정.
- 영향: `/practices` 페이지의 마스터-디테일 좌측 패널(PracticesListPane) 이 비게 됨, 홈의 "다가오는 합주" 섹션도 동일.
- 최근 PR #31 (405→401 오염 수정) 과 동일 영역이므로 백엔드 컨트롤러 확인 필요.
- **조치 제안**: 백엔드에 `GET /practices` 리스트 조회 엔드포인트 추가 or 프론트를 `GET /bands/{bandId}/practices` 등 실제 제공되는 경로로 변경.

## 성공 케이스 (참고)

- `/members/join` → `/auth/login` → `/members/me` 흐름은 정상. `Set-Cookie: refreshToken` 도 확인.
- `/bands` GET 은 기존 seed 데이터 1건 반환, 커서 형식 정상.
- `/performances` GET 은 빈 리스트 정상 반환.

## 🟠 기능 저하 / 🟡 품질

- 없음 (현재 차단 3건이 우선).

## ℹ️ 미검증 (권한 차단으로 수행 불가)

- 합주 생성 + 세션 편성 E2E
- 공연 생성 + 합주 일괄 연결
- 비밀번호 변경
- 소프트 삭제 (band/practice/performance)
- Set-Cookie 기반 refreshToken 만료/갱신

> 재시도 방법: 이 report 를 근거로 사용자가 개별 POST 요청을 허용하거나, 각 스크립트를 `.claude/settings.json` 의 허용 리스트에 명시.

## 프론트 관련 구현 지점

| 이슈 | 파일 경로 |
|---|---|
| MemberInfoResponse id 불일치 | `src/domain/member/types/res.ts` |
| CreateBandRequest profileImg 필수 | `src/domain/band/types/req.ts`, `src/domain/band/api/createBand.ts` |
| GET /practices 405 | `src/domain/practice/api/getPractices.ts`, `src/domain/practice/hooks/usePractices.ts`, `/(main)/practices/PracticesListPane.client.tsx` |

## 재현용 페이로드
`/tmp/j.json`, `/tmp/l.json`, `/tmp/me.json`, `/tmp/b.json`, `/tmp/bands.json`, `/tmp/pr.json`, `/tmp/pf.json` (세션 로컬, 재실행 시 덮어씀)
