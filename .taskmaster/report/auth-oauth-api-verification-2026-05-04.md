# OAuth FE 연동 검증 리포트 (2026-05-04)

## 메타

- 작성일: 2026-05-04
- 작성자: FE
- 대상 BE: `http://localhost:8080` (develop HEAD = e748f71 시점 BE 명세)
- 대상 FE: `feat/BD-14-oauth-sdk-fe` (develop 분기, BD-14)
- 검증 도구: curl + browser DevTools (정상 흐름은 브라우저 수동 테스트 필요)
- BE 명세 출처: 사용자 제공 "v1 백엔드 OAuth 구성 / FE 연동 명세" + 직접 swagger 교차 + Kotlin 소스 확인

---

## 0. 한 줄 요약

BE 가 token-submission 흐름(FE SDK → 토큰 → BE 검증) 으로 구현되어 있어, 기존 `feat/BD-14-oauth-fe` 의 redirect-flow 구현은 폐기. SDK 기반으로 전면 재작성하여 라이브 검증(BE 401/400/CORS) 통과. 정상 흐름(정상 토큰 발급 → JWT 수신) 은 외부 콘솔 셋업 + 브라우저 수동 테스트 필요.

---

## 1. BE Contract (검증 후 확정)

| 항목 | 값 |
|---|---|
| Kakao endpoint | `POST /api/v1/auth/oauth/kakao` |
| Kakao body | `{ accessToken: string }` (BE Bean Validation `@NotBlank`) |
| Google endpoint | `POST /api/v1/auth/oauth/google` |
| Google body | `{ idToken: string }` (BE Bean Validation `@NotBlank`) |
| 응답 | `ApiResponse<{ accessToken, isNewMember }>` + `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=14d` |
| 인증 | 불필요 (FE 가 _skipAuthHeader + _skipAuthRefresh 로 호출) |

---

## 2. 라이브 검증 결과

| # | 케이스 | 호출 | 응답 | 판정 |
|---|---|---|---|---|
| 1 | Kakao 잘못된 access token | `POST /auth/oauth/kakao { accessToken: "clearly-not-a-token" }` | `401 OAUTH_TOKEN_INVALID` | 정상 |
| 2 | Google 잘못된 ID token | `POST /auth/oauth/google { idToken: "clearly-not-a-jwt" }` | `401 OAUTH_TOKEN_INVALID` | 정상 |
| 3 | Google 빈 idToken | `POST /auth/oauth/google { idToken: "" }` | `400 INVALID_INPUT_VALUE` (`fieldErrors.idToken`) | 정상 |
| 4 | refresh endpoint 존재 | `POST /api/v1/auth/refresh` (no cookie) | `401` | 정상 (인증 없으면 401) |
| 5 | CORS preflight | `OPTIONS /auth/oauth/google` (Origin: localhost:3000) | `200`, `Allow-Origin: localhost:3000`, `Allow-Credentials: true`, `Expose-Headers: Set-Cookie` | 정상 |
| 6 | OAuth Provider 정상 흐름 | (브라우저 SDK 호출 필요) | — | **사용자 수동 테스트 필요** |
| 7 | 신규 가입 + 로그인 분기 | `isNewMember=true` 응답 | — | 사용자 수동 테스트 필요 |
| 8 | provider mismatch (이메일 동일, 다른 provider) | `409 OAUTH_PROVIDER_MISMATCH` | — | 시나리오 재현 가능 시 검증 |

응답 본문 raw:
```json
// case 1, 2
{
  "success": false,
  "message": "유효하지 않은 소셜 인증 토큰입니다.",
  "code": "OAUTH_TOKEN_INVALID",
  "timestamp": "2026-05-04T16:29:11.060388"
}
// case 3
{
  "success": false,
  "message": "공백일 수 없습니다",
  "code": "INVALID_INPUT_VALUE",
  "fieldErrors": { "idToken": "공백일 수 없습니다" },
  "timestamp": "2026-05-04T16:29:11.494218"
}
```

---

## 3. FE 구현 요약

### 3-1. 추가/변경 파일

```
src/global/config/env.ts                     # KAKAO_JS_KEY / GOOGLE_CLIENT_ID schema 추가 (optional + 빈문자열 normalize)
src/global/types/kakao-sdk.d.ts              # Kakao SDK 2.x 최소 표면
src/global/types/google-gsi.d.ts             # Google Identity Services 최소 표면

src/domain/auth/oauth/kakao.ts               # SDK 동적 로드 (SRI 포함) + Kakao.init + Kakao.Auth.login → access token
src/domain/auth/oauth/google.ts              # GIS 동적 로드 + initialize (FedCM on) + prompt() → ID token
src/domain/auth/oauth/index.ts               # 배럴 + oauthErrorMessage (BE code → 한국어 안내)

src/domain/auth/types/req.ts                 # KakaoLoginRequest / GoogleLoginRequest 추가
src/domain/auth/types/res.ts                 # OAuthLoginResponse 추가
src/domain/auth/types/index.ts               # barrel 갱신

src/domain/auth/api/kakaoLogin.ts            # POST /auth/oauth/kakao + _skipAuthRefresh + _skipAuthHeader
src/domain/auth/api/googleLogin.ts           # POST /auth/oauth/google + 동일

src/domain/auth/hooks/useKakaoLogin.ts       # TanStack mutation
src/domain/auth/hooks/useGoogleLogin.ts      # 동일

src/app/(auth)/login/OAuthSection.client.tsx # 카카오/구글 버튼 onClick 연결, isNewMember 분기 메시지, busy 시 disabled
```

### 3-2. 핵심 결정

- **`_skipAuthRefresh: true` + `_skipAuthHeader: true`** — OAuth 호출은 인증 전이므로 401 인터셉터의 refresh 루프를 건너뛴다. 이 두 옵션이 없으면 BE 의 `401 OAUTH_TOKEN_INVALID` 가 자동 refresh 시도 → refresh 실패 → 사용자 unauthenticated 처리로 빠져 도메인 메시지가 사용자에게 노출되지 않는다.
- **SDK loader 는 singleton promise** — 한 번만 script 삽입, 이후 호출은 캐시된 promise.
- **Kakao SDK SRI 해시 포함** — supply chain 공격 방지 (CDN 변조 시 브라우저가 거부).
- **Google FedCM 활성화** (`use_fedcm_for_prompt: true`) — Chrome third-party cookie 정책과 무관하게 prompt 표시.
- **isNewMember 분기** — 응답의 `isNewMember=true` 면 환영 토스트, 아니면 일반 로그인 토스트. (온보딩 페이지 라우팅은 별도 작업)
- **버튼 disabled 처리** — 두 mutation 중 하나라도 pending 이면 모든 OAuth 버튼 disabled (중복 클릭 방지).

### 3-3. 환경변수 명칭

| FE | BE | 비고 |
|---|---|---|
| `NEXT_PUBLIC_KAKAO_JS_KEY` | (BE 미사용) | Kakao JavaScript SDK 키 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_ID` | **반드시 동일 값** (audience 검증) |

`.env.local` (gitignored) 에 사용자 발급 키 주입 완료.

---

## 4. 미검증 항목 / 사용자 브라우저 테스트 필요

다음은 라이브 환경(콘솔 셋업 + 브라우저 SDK + 사용자 동의) 이 필요해 자동화 검증 불가.

### 4-1. 시나리오 (브라우저에서 수행)

1. **Kakao 신규 가입**
   - `pnpm dev` → `http://localhost:3000/login`
   - "카카오로 계속하기" 클릭
   - Kakao popup 에서 동의 (account_email 필수)
   - 기대: 토스트 "환영합니다. 가입이 완료되었습니다." → `/home` 이동, DevTools Network 응답에 `isNewMember=true`, Set-Cookie `refreshToken` 확인

2. **Kakao 기존 로그인**
   - 위 1) 직후 로그아웃 → 다시 카카오 로그인
   - 기대: 토스트 "로그인되었습니다.", `isNewMember=false`

3. **Google 신규 가입**
   - "구글로 계속하기" 클릭 → GIS prompt 동의
   - 기대: 1) 과 동일 시나리오 (단 prompt 가 third-party cookie 차단으로 안 뜨면 fallback 안내 토스트)

4. **Google 기존 로그인**
   - 위 3) 직후 로그아웃 → 다시 구글 로그인
   - 기대: 토스트 "로그인되었습니다.", `isNewMember=false`

5. **Provider mismatch**
   - 같은 이메일을 Kakao 와 Google 양쪽에 가지고 있는 사용자가 한쪽으로 가입 → 다른 쪽으로 로그인 시도
   - 기대: 토스트 "이미 다른 소셜 계정으로 가입된 이메일입니다."

6. **사용자 취소**
   - SDK popup 에서 [취소] 클릭
   - 기대: 토스트 "카카오 로그인이 취소되었습니다." (또는 GIS dismissed 메시지)

### 4-2. 사전 콘솔 셋업 체크리스트

- [ ] **Kakao Developers**: JavaScript SDK 도메인 등록 (`http://localhost:3000`), 카카오 로그인 활성화, 동의항목 `account_email` + `profile_nickname`, 카카오 로그인 리다이렉트 URI 등록 (사용은 안 하지만 콘솔이 요구)
- [ ] **Google Cloud Console**: OAuth Web Client ID 발급 + 승인된 자바스크립트 출처 `http://localhost:3000`
- [ ] **BE**: `GOOGLE_OAUTH_CLIENT_ID` 환경변수 = FE `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 와 동일 값 + 재시작

---

## 5. 알려진 결함 / BE 측 확인 요청

### 5-1. Refresh Token TTL mismatch (BE 명세 작성자 보고)

- JWT exp: 25,200초 (7시간) — `application-security.yaml:3`
- Cookie Max-Age: 14일 — `CookieUtil.kt:14`
- 영향: 쿠키는 살아 있는데 JWT 가 만료된 상태 발생 가능. 7시간 후 refresh 시도 시 BE 가 JWT 검증 실패 → FE 가 401 받고 로그아웃 처리.
- 권고: 둘 중 하나로 통일 (보통 14일이 표준).

### 5-2. 일반 로그인 (`/auth/login`) 도 401 인터셉터 우회 검토

- 현재 `src/domain/auth/api/login.ts` 는 `_skipAuthRefresh` 미설정.
- BE 가 잘못된 비밀번호에 401 을 반환할 경우 동일한 자동 refresh 루프 발동.
- 본 PR 범위 외 — 별도 이슈로 분리 권고.

### 5-3. Apple OAuth (BD-13)

- 본 PR 범위 외. id_token 기반 흐름이 다름 (form_post 또는 SDK 별도).

---

## 6. FE 후속 작업 (별도 이슈 권고)

- [ ] `isNewMember=true` 시 온보딩 페이지로 라우팅 (`/onboarding` 신규)
- [ ] Google prompt 가 차단된 경우 GIS 표준 버튼 fallback (현재는 안내 토스트만)
- [ ] OAuth 사용자에 대해 비밀번호 변경 화면 비노출 (`OAUTH_PASSWORD_CHANGE_NOT_ALLOWED` 방지)
- [ ] Apple OAuth (BD-13) 도입

---

끝.
