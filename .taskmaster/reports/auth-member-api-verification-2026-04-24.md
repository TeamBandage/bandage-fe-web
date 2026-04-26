# Auth / Member API 프론트 연동 검증 리포트 (Task 6 / Issue #8)

- **작성일**: 2026-04-24 (Asia/Seoul)
- **검증 주체**: 프론트엔드 (Bandage-FE-Web, branch `feat/#8-auth-member`)
- **백엔드 기동 URL**: `http://localhost:8080`
- **검증 도구**: `curl` 직접 호출 — 재현용 페이로드 `/tmp/bandage-api-test/*.json`
- **검증 범위**: 프론트 `src/domain/auth/api/*`, `src/domain/member/api/*` 에서 호출하는 9개 엔드포인트
- **목적**: 백엔드 팀(또는 백엔드 AI)이 **이슈 재현 → 원인 확인 → 수정**까지 할 수 있도록 실제 요청/응답 페어와 권장 조치를 근거와 함께 전달

> **업데이트 (2026-04-24)**: 검증 중 백엔드 로그에서 `io.jsonwebtoken.MalformedJwtException` 스택 트레이스가 포착되어 §2-11, §3-A, §3-C 에 반영. 403 이슈의 공통 원인이 `JwtAuthenticationFilter` 로 수렴됨.

---

## 1. 테스트한 API 목록

프론트의 `apiClient` 가 `ApiResponse<T>` 래퍼를 언래핑하여 `data` 만 반환한다는 전제를 두고 호출합니다. 모든 요청은 `Content-Type: application/json` + `credentials: include`(브라우저) / curl `-b` (테스트) 로 쿠키 전송. 보호 엔드포인트는 `Authorization: Bearer <accessToken>` 포함.

| # | Path | Method | 인증 | 프론트 호출 | 결과 |
| --- | --- | --- | --- | --- | --- |
| 1 | `/api/v1/members/join` | POST | 불필요 | `domain/member/api/join.ts` | ✅ 정상 |
| 2 | `/api/v1/auth/login` | POST | 불필요 | `domain/auth/api/login.ts` | ✅ 정상 |
| 3 | `/api/v1/members/me` | GET | Bearer | `domain/member/api/getMe.ts` | ⚠️ 응답 `data: null` |
| 4 | `/api/v1/members/me` | PATCH | Bearer | `domain/member/api/updateMe.ts` | ⚠️ 응답 `data: null` |
| 5 | `/api/v1/auth/password` | PATCH | Bearer | `domain/auth/api/changePassword.ts` | ✅ 정상 |
| 6 | `/api/v1/auth/refresh` | POST | 쿠키 | `domain/auth/api/refresh.ts` · `global/api/apiClient.ts` | ❌ **403 고정** |
| 7 | `/api/v1/auth/logout` | DELETE | Bearer | `domain/auth/api/logout.ts` | ✅ 정상 |
| 8 | `/api/v1/members/me` | DELETE | Bearer | `domain/member/api/withdraw.ts` | ✅ 정상 |
| 9 | (공통 동작) 보호 엔드포인트에 Bearer 누락/무효 | — | — | apiClient 공통 에러 처리 | ⚠️ **401 대신 403 반환** |

---

## 2. 케이스 별 실제 응답 값

아래 기록은 실제 curl 호출 결과 그대로입니다. 타임스탬프와 토큰은 단일 시나리오에서 수집되어 서로 연관됩니다.

### 2-1. 회원가입 `POST /api/v1/members/join`

**요청**
```http
POST /api/v1/members/join HTTP/1.1
Content-Type: application/json

{"email":"qa+1776990379@bandage.test","password":"pw12345678","name":"QA테스터","contact":"010-1234-5678"}
```

**응답 (HTTP 200)**
```json
{
  "success": true,
  "message": null,
  "data": { "id": 1, "email": "qa+1776990379@bandage.test" },
  "timestamp": "2026-04-24T09:26:35.635271"
}
```

판정: ✅ **정상**. API_SPEC 2-1 과 완전 일치.

---

### 2-2. 로그인 `POST /api/v1/auth/login`

**요청**
```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{"email":"qa+1776990379@bandage.test","password":"pw12345678"}
```

**응답 (HTTP 200)**
```http
Set-Cookie: refreshToken=eyJhbGciOiJIUzUxMiJ9....UYfSN...H7xw;
            Path=/; Max-Age=1209600; Expires=Fri, 08 May 2026 00:27:01 GMT;
            Secure; HttpOnly; SameSite=None
```
```json
{
  "success": true,
  "message": null,
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwicm9sZSI6IlJPTEVfTUVNQkVSIiwiaWF0IjoxNzc2OTkwNDIxLCJleHAiOjE3NzY5OTQwMjF9...EDQpYA"
  },
  "timestamp": "2026-04-24T09:27:01.812955"
}
```

판정: ✅ **정상**. accessToken payload 확인 결과 `sub:"1"`, `role:"ROLE_MEMBER"`, `iat→exp` 3600초(1시간) 유효기간.

---

### 2-3. 내 정보 조회 `GET /api/v1/members/me`

**요청**
```http
GET /api/v1/members/me HTTP/1.1
Authorization: Bearer <accessToken>
```

**응답 (HTTP 200)**
```json
{
  "success": true,
  "message": null,
  "data": null,
  "timestamp": "2026-04-24T09:27:11.40376"
}
```

판정: ⚠️ **`data: null`**. API_SPEC 2-2 에도 "구현 예정 — 현재 `Unit` 반환" 으로 명시되어 있어 설계된 상태. 프론트는 타입을 `MemberInfoResponse | null` 로 선언해 대응 중이므로 백엔드 구현 완료 시 그대로 채워서 내려주면 됨(아래 §3-B 참고).

---

### 2-4. 내 정보 수정 `PATCH /api/v1/members/me`

**요청**
```http
PATCH /api/v1/members/me HTTP/1.1
Authorization: Bearer <accessToken>
Content-Type: application/json

{"name":"QA변경","contact":"010-9999-8888"}
```

**응답 (HTTP 200)**
```json
{
  "success": true,
  "message": null,
  "data": null,
  "timestamp": "2026-04-24T09:27:28.826705"
}
```

판정: ⚠️ **`data: null`**. 기능적으로 성공 응답이므로 프론트에서는 성공 토스트 + `member.me` 쿼리 invalidate 가 정상 동작. 다만 업데이트된 엔티티(또는 최소한 변경 필드 반영본)를 `data` 에 담아주면 `queryClient.setQueryData` 로 즉시 UI 반영이 가능해 UX 개선됨. 아래 §3-B.

---

### 2-5. 비밀번호 변경 `PATCH /api/v1/auth/password`

**요청**
```http
PATCH /api/v1/auth/password HTTP/1.1
Authorization: Bearer <accessToken>
Content-Type: application/json

{"originalPassword":"pw12345678","newPassword":"newpw12345678"}
```

**응답 (HTTP 200)**
```http
Set-Cookie: refreshToken=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;
            Secure; HttpOnly; SameSite=None
```
```json
{
  "success": true,
  "message": null,
  "data": null,
  "timestamp": "2026-04-24T09:29:02.650085"
}
```

판정: ✅ **정상**. refresh 쿠키 즉시 폐기 확인. 변경된 비밀번호로 재로그인 시 200 + 새 `Set-Cookie: refreshToken`, `data.accessToken` 발급도 정상 확인.

---

### 2-6. 토큰 재발급 `POST /api/v1/auth/refresh` — ❌ 문제

**요청 1 (cookie-jar 전달)**
```http
POST /api/v1/auth/refresh HTTP/1.1
Cookie: refreshToken=<로그인 직후 발급받은 JWT>
```

**응답 (HTTP 403, body 없음)**
```http
HTTP/1.1 403
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
X-Frame-Options: DENY
Content-Length: 0
```

**재현 조건**: 아래 모든 경우에서 403 으로 동일
- 로그인 직후(~5초 이내) fresh refreshToken 사용
- curl `-b cookie.txt` / `-H "Cookie: refreshToken=..."` 양쪽 모두
- `Origin: http://localhost:3100` + `Referer` 헤더 추가
- 비밀번호 변경 직후 재로그인 받은 신규 유저의 refreshToken

**JWT payload 검증 (base64 decode)**
```json
{ "sub": "2", "iat": 1776990672, "exp": 1777015872 }
```
→ 서명된 payload 자체는 정상, exp 는 iat+7시간(25200s) 이후.

판정: ❌ **백엔드 이슈**. refresh 엔드포인트가 유효한 refreshToken 쿠키에도 403을 반환.

**프론트 영향**: `apiClient` 의 401 인터셉터는 401 수신 시 `/auth/refresh` 를 호출해 accessToken 을 교체하고 원 요청을 재시도하도록 구현되어 있음. 현재 refresh 가 403 으로 실패하므로 이 경로가 정상 종료되지 않고 `UNAUTHORIZED` 에러 throw + 로그인 페이지 강제 이동으로 귀결됨.

---

### 2-7. 로그아웃 `DELETE /api/v1/auth/logout`

**요청**
```http
DELETE /api/v1/auth/logout HTTP/1.1
Authorization: Bearer <accessToken>
```

**응답 (HTTP 200)**
```http
Set-Cookie: refreshToken=; Path=/; Max-Age=0; ... Secure; HttpOnly; SameSite=None
```
```json
{ "success": true, "message": null, "data": null, "timestamp": "2026-04-24T09:34:11.565717" }
```

판정: ✅ **정상**.

---

### 2-8. 회원 탈퇴 `DELETE /api/v1/members/me`

**요청**
```http
DELETE /api/v1/members/me HTTP/1.1
Authorization: Bearer <accessToken>
```

**응답 (HTTP 200)** + refreshToken 쿠키 즉시 폐기
```json
{ "success": true, "message": null, "data": null, "timestamp": "2026-04-24T09:42:47.535411" }
```

**탈퇴 후 동일 이메일 재로그인 시도**
```json
HTTP 404
{ "success": false, "message": "요청한 회원 정보를 찾을 수 없습니다.", "data": null, ... }
```

판정: ✅ **정상** (soft delete 로 예상된 동작).

---

### 2-9. 인증 실패 상황의 응답 코드 — ⚠️ 문제

| 케이스 | 기대 | 실제 | 실제 body |
| --- | --- | --- | --- |
| Bearer 헤더 누락 + `GET /members/me` | 401 | **403** | (비어 있음) |
| 유효하지 않은 Bearer (`Bearer invalid.token.here`) | 401 | **403** | (비어 있음) |

판정: ⚠️ **RFC 7235 기준상 인증 누락/무효는 401, 권한 부족은 403이 맞음**. 현재 백엔드는 전부 403으로 묶어서 내려보냄. 프론트 `apiClient` 의 401 인터셉터가 트리거되지 않아 자동 refresh 경로를 못 타는 것이 가장 큰 실사용 영향.

---

### 2-11. 🔎 백엔드 로그 캡처 — `MalformedJwtException`

위 2-6 및 2-9 케이스와 **같은 시간대**에 백엔드 애플리케이션 로그에서 아래 예외가 반복 포착되었습니다. 이 예외는 **403 응답의 최종 원인**으로 보입니다.

```text
io.jsonwebtoken.MalformedJwtException: Malformed protected header JSON:
  Unable to deserialize: Unexpected character ('�' (code 65533 / 0xfffd)):
  expected a valid value (JSON String, Number, Array, Object or token 'null', 'true' or 'false')
  at [Source: REDACTED (`StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION` disabled); line: 1, column: 1]

  at io.jsonwebtoken.impl.io.JsonObjectDeserializer.malformed(JsonObjectDeserializer.java:76)
  at io.jsonwebtoken.impl.DefaultJwtParser.deserialize(DefaultJwtParser.java:899)
  ...
  at com.bandage.v1.global.security.jwt.JwtProvider.validateToken(JwtProvider.kt:57)
  at com.bandage.v1.global.security.filter.JwtAuthenticationFilter.doFilterInternal(JwtAuthenticationFilter.kt:19)

Caused by: io.jsonwebtoken.io.DeserializationException: Unable to deserialize:
  Unexpected character ('�' (code 65533 / 0xfffd)): ...
Caused by: com.fasterxml.jackson.core.JsonParseException:
  Unexpected character ('�' (code 65533 / 0xfffd)): ...
```

**해석**
- `JwtProvider.validateToken` 에 전달된 문자열을 `jjwt 0.12.6` 이 파싱하던 중, **Base64URL 디코딩 결과의 첫 바이트가 유효한 JSON 이 아님** (UTF-8 replacement character `U+FFFD` 로 치환됨)
- 즉 필터가 받은 "토큰" 이 `eyJhbGciOi…` 형태의 실제 JWT 가 아니거나, JWT 앞에 쓰레기 바이트/접두어가 섞여 있음
- 이 예외가 어떤 catch 블록에서 처리되든 결과적으로 **Spring Security 체인이 403** 으로 마감하는 구조로 추정

**연관 케이스**
| 테스트 | 추정 원인 |
| --- | --- |
| 2-9a (Authorization 누락) | 필터가 헤더 미존재 시 **빈 문자열 / `null`** 을 그대로 `validateToken` 에 넘겨 호출 → 빈 입력 디코딩 실패 |
| 2-9b (`Bearer invalid.token.here`) | `"Bearer "` 제거 후 남은 `invalid.token.here` 가 JWT 가 아니므로 base64url 디코딩 시 FFFD 발생 |
| 2-6 (refresh) | Authorization 헤더를 보내지 **않았는데도** 필터가 실행되어 위 경로로 빠졌을 가능성. 혹은 필터가 `refreshToken` 쿠키를 fallback 으로 accessToken 자리에 대입하여 검증하려 시도 |

**백엔드 확인 지점**
- `JwtAuthenticationFilter.kt:19` 부근에서 토큰 추출 전 null/blank 분기 여부
- 추출 로직이 `Authorization` 헤더 이외의 소스(쿠키, 쿼리파라미터 등)에서 값을 채우는지
- `SecurityFilterChain` 에서 `/api/v1/auth/refresh`, `/api/v1/auth/login`, `/api/v1/members/join` 이 permitAll 이어도 필터 자체가 앞단에서 실행되고 있는지 (일반적으로 `JwtAuthenticationFilter` 는 이들 경로를 skip 해야 함)

---

### 2-10. 참고 — 일반 에러 응답의 HTTP + message 매핑

| 상황 | HTTP | `message` | `code` 필드 |
| --- | --- | --- | --- |
| 중복 이메일 join | 409 | "이미 회원가입된 e-mail 입니다" | 없음 |
| 잘못된 비밀번호 login | 400 | "유효하지 않은 비밀번호입니다." | 없음 |
| 존재하지 않는 이메일 login / 탈퇴 후 로그인 | 404 | "요청한 회원 정보를 찾을 수 없습니다." | 없음 |
| 인증 실패 / refresh 실패 | 403 | (없음) | 없음 |

---

## 3. 권장 조치 내용 및 검토 필요 사항

우선순위 순으로 나열합니다. A~D 각각 독립 수정 가능.

### A. 🔴 `POST /api/v1/auth/refresh` 403 수정 — **최우선**

**영향**: accessToken 만료 시점에 사용자가 자동 로그아웃됨. 1시간 유효기간이 짧게 설정되어 있어 실사용에 큰 불편.

**재현 절차**
1. `POST /api/v1/members/join` 으로 신규 유저 가입
2. `POST /api/v1/auth/login` 으로 로그인 → `Set-Cookie: refreshToken` 수신
3. 해당 refresh 쿠키를 그대로 담아 `POST /api/v1/auth/refresh` 호출 (Authorization 헤더 없이) → 403

**추정 원인 (§2-11 로그 기반)**
`JwtAuthenticationFilter` 가 refresh 경로에서도 실행되며, Authorization 헤더가 없어서 `null` 또는 빈 문자열을 `JwtProvider.validateToken()` 에 그대로 넘기고 있을 가능성이 큼. 이 때문에 refresh 컨트롤러까지 도달하지 못하고 필터 단에서 403으로 마감됨.

**백엔드 확인 포인트**
- [ ] `JwtAuthenticationFilter.kt:19` 에서 `Authorization` 헤더가 `null`/`blank`/`Bearer ` 접두어 부재 시 **즉시 `chain.doFilter(request, response); return`** 으로 빠져나가는지
- [ ] `/api/v1/auth/refresh` 를 `JwtAuthenticationFilter` 의 `shouldNotFilter()` 대상(또는 `SecurityFilterChain` 화이트리스트)으로 명시했는지 — `/api/v1/auth/login`, `/api/v1/members/join` 도 동일 검토
- [ ] refresh 컨트롤러가 `refreshToken` 쿠키를 읽는 로직의 쿠키 이름/Path 가 로그인 시 설정한 값과 일치하는지
- [ ] CORS `allowedOriginPatterns` / `allowCredentials = true` 설정이 refresh 엔드포인트에도 적용되는지
- [ ] JWT 검증 시 refresh 서명키 / 만료 허용시간(clock skew) 설정

**프론트 측 대응 (백엔드 수정 전까지는 무조치)**: 현 구조 유지. 백엔드 수정 후 추가 코드 변경 없이 복구됨.

---

### B. 🟠 `GET /members/me`, `PATCH /members/me` 응답 `data` 바디 채우기

**현황**: 둘 다 200 반환하지만 `data: null`. API_SPEC 2-2 도 "구현 예정 — 현재 `Unit` 반환" 으로 유지 중.

**요청**
- `GET /api/v1/members/me` → 아래 shape 으로 내려주기 (프론트 `MemberInfoResponse` 와 일치)
  ```json
  { "id": 1, "email": "...", "name": "...", "contact": "...", "createdAt": "2026-04-24T09:26:35" }
  ```
- `PATCH /api/v1/members/me` → 동일 shape(수정 반영본) 또는 최소한 갱신된 필드만 포함한 부분 객체. 낙관적 UI 업데이트를 가능하게 함.

**영향**: 마이페이지(/me) 진입 시 프로필 표시 불가. 현재 프론트는 `ErrorState` 로 회피 중.

---

### C. 🟠 인증 실패 응답을 401 / 403 로 구분

**요청**
- 토큰 누락/무효/만료 → **`401 Unauthorized`** + `WWW-Authenticate: Bearer error="invalid_token"` (권장) 헤더
- 인증은 되었으나 권한 부족(역할 미스매치, 소유권 불일치 등) → **`403 Forbidden`**

**현행**: 둘 모두 `403 + empty body`

**§2-11 로그로부터 드러난 근본 원인**
`JwtAuthenticationFilter` 가 `MalformedJwtException`/`ExpiredJwtException`/`SignatureException` 을 포함한 모든 JWT 관련 예외를 **잡지 않거나 잘못 처리**해서, Spring Security 의 기본 `AccessDeniedHandler` 로 떨어져 403 이 되고 있음. `AuthenticationEntryPoint` 경로로 유도되어야 401 이 반환됨.

**백엔드 개선안 (권장 순서)**
1. `JwtAuthenticationFilter` 에서 예외를 catch → `SecurityContextHolder.clearContext()` 후 **그대로 throw 하지 않고** `request.setAttribute("jwt_exception", e)` 로 표식만 남기고 `chain.doFilter` 진행
2. `AuthenticationEntryPoint` 구현체를 별도 작성해 `response.sendError(401, …)` + `WWW-Authenticate` 헤더 세팅, 가능하면 JSON body `{"success": false, "code": "INVALID_TOKEN", "message": "..."}` 동반
3. `SecurityFilterChain.exceptionHandling { authenticationEntryPoint(...) }` 로 주입
4. `AccessDeniedHandler` 는 권한 부족 전용으로 유지 (403)

**프론트 측 임시 우회 (백엔드 수정 전까지 필요할 때만)**
`apiClient` 의 refresh 트리거 조건을 `status === 401 || status === 403` 로 완화. 다만 refresh 자체도 403 이므로 연쇄 고장 상태 — §3-A 해결 전에는 효과 없음.

---

### D. 🟡 에러 응답 body 에 `code` 필드 추가 (중기)

**요청**
```json
{
  "success": false,
  "message": "이미 회원가입된 e-mail 입니다",
  "code": "MEMBER_EMAIL_DUPLICATED",
  "data": null,
  "timestamp": "..."
}
```

- 프론트의 `ApiError.code` 는 현재 body 에 `code` 가 없어서 `'UNKNOWN_ERROR'` 로 fallback
- 다국어 지원이 들어오면 message 기반 분기는 깨지므로 안정된 식별자(`code`) 가 필요
- 400 의 유효성 검증 오류의 경우 `fieldErrors: { "email": "이메일 형식이 아닙니다" }` 같은 필드별 맵도 함께 내려주면 폼 인라인 에러 표시가 정확해짐

**영향**: 현시점 기능 동작에는 영향 없음. 추후 i18n / 상세 UX 분기를 위해 필요.

---

### E. ℹ️ 참고 — 로컬 개발 편의 항목

| 항목 | 현재 | 참고 |
| --- | --- | --- |
| `Set-Cookie: refreshToken` 의 `Secure` 플래그 | 항상 활성 | 로컬 `http://localhost` 에서 브라우저는 허용하지만 curl/일부 테스트 도구는 차단. 프론트 사용에는 지장 없으나 수동 테스트 시 주의 |
| `SameSite=None` | 활성 | FE/BE 도메인 분리 배포를 고려한 설정이라면 적절 |
| accessToken 유효기간 | 1시간(3600s) | refresh 수정 전까지는 짧게 느껴질 수 있음 |

---

## 4. 부록 — 프론트 측 관련 구현 지점

```text
src/global/api/apiClient.ts        # 401 인터셉터 / refresh 뮤텍스 / unauthorized handler
src/global/store/authStore.ts      # accessToken(sessionStorage persist) 관리
src/global/error/ApiError.ts       # code/message/status/fieldErrors 래퍼
src/domain/auth/api/*.ts           # login / logout / refresh / changePassword
src/domain/member/api/*.ts         # join / getMe / updateMe / withdraw
src/middleware.ts                  # refreshToken 쿠키 유무 기반 /login 리다이렉트
```

위 파일들은 현재 A~E 중 A, C 가 해결되면 추가 수정 없이 정상 동작 복귀. B / D 는 백엔드 수정 이후 프론트에서 타입 갱신만 하면 됨.

---

## 5. 재현용 페이로드 파일 (로컬 전용)

```
/tmp/bandage-api-test/
  ├── state.env          # EMAIL / PASS / NEW_PASS / ACCESS_TOKEN
  ├── login.json
  ├── login2.json        # 비번 변경 후
  ├── login3.json        # 신규 유저
  ├── join2.json
  ├── update.json
  ├── changepw.json
  ├── bad_login.json
  ├── no_user.json
  ├── cookies.txt        # 첫 유저 refresh 쿠키 jar
  ├── cookies2.txt       # 신규 유저 refresh 쿠키 jar
  └── cookies3.txt
```

> 참고: 동일 이메일로의 재현을 피하려면 `EMAIL="qa+$(date +%s)@bandage.test"` 처럼 suffix 를 바꿔 시나리오를 돌려 주세요.
