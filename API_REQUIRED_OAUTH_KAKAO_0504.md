# API_REQUIRED_OAUTH_KAKAO_0504.md

작성일: 2026-05-04
작성자: FE
관련 작업: Kakao OAuth — Authorization Code Grant 흐름으로 BE 이관 (BD-14 follow-up)
대상 BE: develop HEAD
참조: `API_REQUIRED_OAUTH_0503.md`, `.taskmaster/report/auth-oauth-api-verification-2026-05-04.md`

---

## 0. 요약

현재 BE Kakao 엔드포인트는 FE 가 발급한 access_token 을 받는 형태인데, **Kakao JavaScript SDK 2.x 가 access_token 을 직접 발급하지 못한다** (`Kakao.Auth.login` 제거됨). 우회로 FE 가 카카오 token endpoint 를 직접 호출해 access_token 을 발급하고 있는데, 이 과정에서 다음 문제가 있다:

1. **client_secret 보관 위치 분산** — 카카오 콘솔 [보안 → Client Secret] 을 ON 으로 설정할 수 없음 (FE 가 secret 보유 불가). 보안성 ↓.
2. **token endpoint 응답 처리가 FE 부담** — 에러 케이스 분기, refresh token 폐기 등이 FE 책임.
3. **Provider 변경 시 FE/BE 양쪽 수정 필요** — 카카오 외 OAuth provider 추가 시 동일 패턴이 FE 에 누적.

해결안: **FE 는 authorization code 만 BE 에 전달, BE 가 카카오 token endpoint POST 로 access_token 교환 + 기존 user info 검증 + JWT 발급**. (Google 은 ID token 흐름 유지 — 변경 없음.)

---

## 1. BE 변경 요청

### 1-1. `POST /api/v1/auth/oauth/kakao` 시그니처 변경

#### 변경 전 (현재)

```kotlin
data class KakaoLoginRequest(
    @NotBlank
    val accessToken: String,
)
```

- BE 가 받은 access_token 으로 `KakaoOAuthClient.fetchUserInfo` 호출

#### 변경 후 (요청)

```kotlin
data class KakaoLoginRequest(
    @NotBlank
    @Schema(description = "Kakao authorize 단계에서 받은 authorization code")
    val code: String,

    @NotBlank
    @Schema(description = "FE 가 authorize 시 사용한 redirect URI. 카카오가 token 교환 시 동일성 검증")
    val redirectUri: String,

    @Schema(description = "(선택) FE CSRF state. BE 측 추가 검증이 필요한 경우만 사용")
    val state: String? = null,
)
```

### 1-2. 컨트롤러 동작 변경

```kotlin
@PostMapping
fun loginWithKakao(
    @Valid @RequestBody request: KakaoLoginRequest,
    response: HttpServletResponse,
): ApiResponse<OAuthLoginApiResponse> {
    // 1) authorization code → access_token 교환 (신규)
    val accessToken = kakaoOAuthClient.exchangeCodeForAccessToken(
        code = request.code,
        redirectUri = request.redirectUri,
    )
    // 2) access_token → user info (기존 fetchUserInfo 재사용)
    val userInfo = kakaoOAuthClient.fetchUserInfo(accessToken)
    // 3) login-or-join (기존 동일)
    val result = oAuthLoginFacade.loginOrJoin(userInfo)
    response.setHeader(HttpHeaders.SET_COOKIE, CookieUtil.generateCookieFrom(result.refreshToken))
    return ApiResponse.success(OAuthLoginApiResponse.of(result))
}
```

### 1-3. `KakaoOAuthClient.exchangeCodeForAccessToken` 신규 메서드

```kotlin
fun exchangeCodeForAccessToken(
    code: String,
    redirectUri: String,
): String {
    val body = LinkedMultiValueMap<String, String>().apply {
        add("grant_type", "authorization_code")
        add("client_id", properties.clientId)
        add("redirect_uri", redirectUri)
        add("code", code)
        if (!properties.clientSecret.isNullOrBlank()) {
            add("client_secret", properties.clientSecret)
        }
    }

    val response = try {
        restClient.post()
            .uri(properties.tokenUri)  // https://kauth.kakao.com/oauth/token
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError) { _, _ ->
                throw BusinessException(ErrorCode.OAUTH_TOKEN_INVALID)
            }
            .onStatus(HttpStatusCode::is5xxServerError) { _, _ ->
                throw BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR)
            }
            .body(KakaoTokenResponse::class.java)
            ?: throw BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR)
    } catch (e: BusinessException) {
        throw e
    } catch (e: RestClientException) {
        throw BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR)
    }

    return response.accessToken
        ?: throw BusinessException(ErrorCode.OAUTH_TOKEN_INVALID)
}

data class KakaoTokenResponse(
    @field:JsonProperty("access_token") val accessToken: String?,
    @field:JsonProperty("token_type") val tokenType: String?,
    @field:JsonProperty("refresh_token") val refreshToken: String?,
    @field:JsonProperty("expires_in") val expiresIn: Long?,
    @field:JsonProperty("scope") val scope: String?,
)
```

### 1-4. `KakaoOAuthProperties` 보강

```kotlin
@ConfigurationProperties(prefix = "oauth.kakao")
data class KakaoOAuthProperties(
    val userInfoUri: String = "https://kapi.kakao.com/v2/user/me",
    /** 신규 — token 교환 endpoint. */
    val tokenUri: String = "https://kauth.kakao.com/oauth/token",
    /** 신규 — Kakao REST API Key 또는 JS Key. token 교환 시 client_id 로 전달. */
    val clientId: String,
    /** 신규 — 카카오 콘솔 [보안 → Client Secret] 활성화 시 발급된 값. nullable. */
    val clientSecret: String? = null,
)
```

### 1-5. `application-security.yaml` 보강

```yaml
oauth:
  kakao:
    user-info-uri: ${KAKAO_USER_INFO_URI:https://kapi.kakao.com/v2/user/me}
    token-uri: ${KAKAO_TOKEN_URI:https://kauth.kakao.com/oauth/token}
    client-id: ${KAKAO_OAUTH_CLIENT_ID} # 신규 — 필수
    client-secret: ${KAKAO_OAUTH_CLIENT_SECRET:} # 신규 — 콘솔에서 활성화 시 주입
  google:
    token-info-uri: ${GOOGLE_TOKEN_INFO_URI:https://oauth2.googleapis.com/tokeninfo}
    client-id: ${GOOGLE_OAUTH_CLIENT_ID:} # 변경 없음
```

### 1-6. 환경변수 (BE 운영 측)

| 변수                        | 필수        | 값 출처                                                         | 비고                                                                         |
| --------------------------- | ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `KAKAO_OAUTH_CLIENT_ID`     | 필수 (신규) | 카카오 콘솔 → 앱 설정 → 일반 → REST API 키 (또는 JavaScript 키) | FE `NEXT_PUBLIC_KAKAO_JS_KEY` 와 동일 값 권장 (콘솔이 동일 앱이면 자동 일치) |
| `KAKAO_OAUTH_CLIENT_SECRET` | 선택 (신규) | 카카오 콘솔 → 보안 → Client Secret → 코드 발급 + ON             | 활성화 권고 (보안 ↑). OFF 면 비워두면 됨                                     |
| `GOOGLE_OAUTH_CLIENT_ID`    | 필수 (기존) | Google Cloud Console                                            | 변경 없음                                                                    |

### 1-7. 에러 응답 (변경 없음)

기존 `OAUTH_TOKEN_INVALID` (401), `OAUTH_PROVIDER_ERROR` (502), `OAUTH_PROVIDER_MISMATCH` (409), `INVALID_INPUT_VALUE` (400) 그대로 유지. token 교환 실패도 `OAUTH_TOKEN_INVALID` 또는 `OAUTH_PROVIDER_ERROR` 로 매핑.

---

## 2. 마이그레이션 / 배포 순서

1. **BE 작업 완료** (위 §1) → dev 환경 배포 + `KAKAO_OAUTH_CLIENT_ID` 환경변수 주입
2. **FE 작업 완료** (본 PR) → dev 빌드 배포
3. **사전 확인** — 카카오 콘솔에서 [보안 → Client Secret] 정책 결정 (ON/OFF)
4. **라이브 검증** — `.taskmaster/report/auth-oauth-kakao-code-verification-YYYY-MM-DD.md`

> BE 가 새 시그니처를 반영하기 전에 FE 만 먼저 배포하면 카카오 로그인이 즉시 깨진다. 반드시 BE 먼저.

---

## 3. FE 변경 (참고)

본 PR (`feat/BD-14-kakao-be-code-exchange`) 에서 함께 수정.

- `KakaoLoginRequest` 타입: `{ accessToken }` → `{ code, redirectUri, state? }`
- `kakaoLogin` API: body 형식만 변경 (엔드포인트/응답 동일)
- `KakaoCallback.client.tsx`: token 교환 로직 제거 → code/state 만 추출해 BE 호출
- `kakao.ts`: `exchangeKakaoCodeForAccessToken` 함수 제거 (불필요)
- `oauth/index.ts` barrel 정리

SDK 사용 부분 (`loadKakao` + `Kakao.Auth.authorize`) 은 유지 — authorize URL 생성과 redirect 흐름은 SDK 가 담당.

---

## 4. 보안 효과

| 측면                     | 변경 전                | 변경 후                                     |
| ------------------------ | ---------------------- | ------------------------------------------- |
| client_secret 위치       | (사용 불가, FE 무보관) | BE 에 보관 — 카카오 콘솔에서 ON 활성화 가능 |
| token endpoint 호출 주체 | 브라우저 (CORS 의존)   | BE 서버 (안정성 ↑)                          |
| FE 노출 정보             | code (단명) + JS Key   | code (단명) + JS Key (변경 없음)            |
| Replay 방어              | code 일회성            | code 일회성 (동일)                          |

추가 효과: BE 가 토큰 교환 응답에서 refresh_token 을 자체 보관/폐기 정책으로 관리 가능 (현재는 FE 가 받은 access_token 만 사용).

---

## 5. 후속 (별도 이슈 권고)

- BE 가 받은 카카오 refresh_token 을 자체 보관해 long-session 지원 (선택)
- 동일 패턴을 Apple OAuth (BD-13) 도입 시 적용
- `OAUTH_PROVIDER_MISMATCH` 케이스에 대한 계정 연결 UX (이미 다른 provider 로 가입된 이메일을 추가 연결)

---

끝.
