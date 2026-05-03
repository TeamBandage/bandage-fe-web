# API_REQUIRED_OAUTH_0503.md

작성일: 2026-05-03
작성자: FE
관련 작업: Kakao / Google OAuth 로그인 FE 구현 (브랜치 `feat/schedule-coordination-v2` 동시 작업본)

---

## 0. 요약

FE 에 Kakao / Google OAuth 로그인 흐름을 구현했다. 백엔드 토큰 교환 방식(client_secret 은 BE 만 보유)을 채택했으며, 실가동을 위해 다음 두 가지가 필요하다.

1. **백엔드 엔드포인트 1종 신규 구현**: `POST /api/v1/auth/oauth/{provider}` (provider = `kakao` | `google`)
2. **공급자 콘솔에서 발급/등록 필요한 키·리다이렉트 URI**

Apple 로그인은 본 작업 범위 외 (FE 버튼은 "준비 중" 토스트 유지).

---

## 1. FE 구현 결과

### 1-1. 추가/수정된 파일

```
src/global/config/env.ts                          # NEXT_PUBLIC_KAKAO_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID 추가
src/global/config/routes.ts                       # ROUTES.OAUTH_CALLBACK(provider)
.env.local                                        # 두 client id placeholder

src/domain/auth/oauth/providers.ts                # provider 메타 + redirectUri 빌더
src/domain/auth/oauth/state.ts                    # CSRF state 저장/검증 (sessionStorage)
src/domain/auth/oauth/start.ts                    # authorize URL 빌드 + window.location.assign
src/domain/auth/api/oauthLogin.ts                 # POST /api/v1/auth/oauth/{provider}
src/domain/auth/hooks/useOAuthLogin.ts            # TanStack mutation
src/domain/auth/types/req.ts                      # OAuthLoginRequest 추가
src/domain/auth/types/index.ts

src/app/(auth)/login/OAuthSection.client.tsx      # 카카오/구글 버튼 onClick 연결
src/app/(auth)/oauth/callback/[provider]/page.tsx
src/app/(auth)/oauth/callback/[provider]/OAuthCallback.client.tsx
```

### 1-2. 흐름 요약

1. 사용자가 로그인 페이지에서 "카카오로 계속하기" / "구글로 계속하기" 클릭
2. FE: state(랜덤 16바이트) 생성 → `sessionStorage` 저장 → provider authorize URL 로 `window.location.assign`
3. provider: 사용자 동의 후 `GET {origin}/oauth/callback/{provider}?code=...&state=...` 으로 리다이렉트
4. FE 콜백: `state` 검증(CSRF) → `POST /api/v1/auth/oauth/{provider}` 으로 `{ code, redirectUri, state }` 전송
5. BE: provider 에 token 교환(client_secret 사용) → 사용자 정보 조회 → 회원 upsert → `accessToken` 반환 + `refreshToken` HttpOnly 쿠키 set
6. FE: `accessToken` 을 `authStore` 저장 → `/home` 으로 redirect

리다이렉트 URI 형식: `{origin}/oauth/callback/{provider}` (예시: `http://localhost:3000/oauth/callback/kakao`).

---

## 2. 백엔드 신규 엔드포인트 (필수 구현)

### 2-1. `POST /api/v1/auth/oauth/{provider}` — OAuth 로그인/가입

| 항목          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| Path Variable | `provider` ∈ { `kakao`, `google` }                                                       |
| 인증          | 불필요 (공개)                                                                            |
| Request Body  | `OAuthLoginRequest`                                                                      |
| Response Body | `ApiResponse<MemberLoginResponse>` (기존 `/auth/login` 와 동일 구조 — `{ accessToken }`) |
| Set-Cookie    | 기존 로그인과 동일하게 `refreshToken` HttpOnly 쿠키 발급                                 |

#### Request DTO

```kotlin
data class OAuthLoginRequest(
    @field:NotBlank val code: String,
    @field:NotBlank val redirectUri: String,   // FE 가 authorize 호출 시 사용한 값과 동일해야 함
    val state: String? = null,                 // 옵션 — BE 측 검증은 권장이지만 FE 가 1차 검증함
)
```

#### Response DTO

기존 `MemberLoginResponse` 재사용 (`{ accessToken: String }`). 응답 래퍼는 `ApiResponse<T>`. refreshToken 은 쿠키로만.

#### 주요 처리 흐름

1. `code + redirectUri` 로 provider token 엔드포인트 호출 (서버에서 `client_secret` 사용)
   - Kakao: `POST https://kauth.kakao.com/oauth/token`
   - Google: `POST https://oauth2.googleapis.com/token`
2. provider userinfo 호출하여 식별자 + 이메일 + 프로필 조회
   - Kakao: `GET https://kapi.kakao.com/v2/user/me`
   - Google: `GET https://openidconnect.googleapis.com/v1/userinfo` (또는 id_token 디코드)
3. 회원 식별 / 신규 가입 분기:
   - 기존 `member_oauth_identity` 테이블에 `(provider, providerUserId)` 매칭 → 있으면 해당 멤버 로그인
   - 없으면 이메일로 기존 회원 매칭 (이메일 인증 필요 여부는 정책 결정 필요)
   - 그래도 없으면 신규 멤버 생성 (닉네임/이메일/프로필 이미지 채움)
4. 토큰 발급:
   - accessToken: 기존 로그인 흐름과 동일한 JWT
   - refreshToken: 동일 정책으로 발급 후 HttpOnly 쿠키 (`Secure`, `SameSite=Lax` 권장)

#### 에러 응답 권장

| 상황                                     | HTTP | code                          |
| ---------------------------------------- | ---- | ----------------------------- |
| code 누락/만료                           | 400  | `OAUTH_INVALID_CODE`          |
| provider 토큰 교환 실패                  | 502  | `OAUTH_PROVIDER_ERROR`        |
| 이메일 미동의 (Kakao 의 경우 가능)       | 400  | `OAUTH_EMAIL_REQUIRED`        |
| 신규가입 정책 위반 (탈퇴 회원 재가입 등) | 409  | `OAUTH_REGISTRATION_BLOCKED`  |
| redirectUri 등록값 불일치                | 400  | `OAUTH_REDIRECT_URI_MISMATCH` |

---

## 3. 도메인 모델 권고 (BE)

```
member (기존)
member_oauth_identity (신규)
  ├─ id BIGINT PK
  ├─ member_id BIGINT FK → member.id
  ├─ provider VARCHAR(16)        -- 'kakao' | 'google'
  ├─ provider_user_id VARCHAR    -- 카카오 id / 구글 sub
  ├─ email VARCHAR (nullable)
  ├─ created_at TIMESTAMP
  ├─ updated_at TIMESTAMP
  ├─ UNIQUE (provider, provider_user_id)
  └─ INDEX (member_id)
```

기존 `member` 테이블의 `password` 컬럼은 OAuth 가입자에 대해 `nullable` 이거나 dummy 값이어야 한다 (현재 NOT NULL 인지 확인 필요).

---

## 4. 발급/등록이 필요한 외부 키 (개발자 확인 요청)

### 4-1. Kakao Developers (https://developers.kakao.com)

| 항목                         | 값/등록                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 애플리케이션 등록            | "Bandage" 앱 (운영/스테이징/로컬 분리 권장)                                                                                                              |
| 카카오 로그인 활성화         | ON                                                                                                                                                       |
| **REST API 키** (FE 노출 OK) | → `.env.local` 의 `NEXT_PUBLIC_KAKAO_CLIENT_ID`                                                                                                          |
| **Client Secret**            | → BE `application.yml` 의 `oauth.kakao.client-secret`                                                                                                    |
| Redirect URI 등록            | `http://localhost:3000/oauth/callback/kakao` (local), `https://<dev-host>/oauth/callback/kakao` (dev), `https://<prod-host>/oauth/callback/kakao` (prod) |
| 동의 항목                    | `profile_nickname` (필수), `account_email` (필수 또는 선택)                                                                                              |

### 4-2. Google Cloud Console (https://console.cloud.google.com)

| 항목                           | 값/등록                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| OAuth 동의 화면                | External, 앱 이름 "Bandage", 승인된 도메인 등록                      |
| 사용자 인증 정보               | OAuth 2.0 Client ID — 유형: **웹 애플리케이션**                      |
| **클라이언트 ID** (FE 노출 OK) | → `.env.local` 의 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`                     |
| **클라이언트 보안 비밀**       | → BE `application.yml` 의 `oauth.google.client-secret`               |
| 승인된 자바스크립트 출처       | `http://localhost:3000`, `https://<dev-host>`, `https://<prod-host>` |
| 승인된 리디렉션 URI            | `http://localhost:3000/oauth/callback/google`, dev/prod 동일 패턴    |
| Scope                          | `openid email profile`                                               |

### 4-3. 환경별 분리 권장

`.env.local`(local), `.env.development`(dev 빌드), `.env.production`(prod 빌드) 각각에 다른 Client ID 를 두고, 백엔드도 환경별 secret 을 분리. 운영/개발 간 사용자 풀이 섞이지 않도록 별도 앱으로 등록.

---

## 5. FE 가 백엔드에 의존하는 응답 계약 정리

| 케이스                         | 기대 응답                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| 정상 로그인 (기존 회원)        | 200, `{ accessToken }`, refreshToken 쿠키 set                                        |
| 정상 가입 + 로그인 (신규 회원) | 200, 동일. 별도 분기 코드 불필요 (`isNew: boolean` 추가가 필요하면 알려주면 FE 반영) |
| code 만료/무효                 | 400 + `code: OAUTH_INVALID_CODE`, `message` 한국어                                   |
| provider 장애                  | 502 + `code: OAUTH_PROVIDER_ERROR`                                                   |
| 이메일 동의 미수집 (Kakao)     | 400 + `code: OAUTH_EMAIL_REQUIRED`                                                   |

응답 본문은 기존 `ApiResponse<T>` 래퍼 유지. FE 의 `ApiError` 정규화 흐름과 일관됨.

---

## 6. 향후 확장 (참고)

- **계정 연동**: 기존 이메일 회원이 카카오 계정을 추가 연결하는 흐름 (`/api/v1/auth/oauth/{provider}/link`, 인증 필요).
- **Apple 로그인**: 본 작업 범위 외. FE 버튼은 placeholder 유지. Apple 은 `id_token` 기반이라 흐름이 다름.
- **PKCE**: 현재는 BE 가 client_secret 을 보유하므로 PKCE 미적용. 추후 모바일/네이티브 클라이언트 추가 시 도입 검토.
- **state 서버 검증**: 현재 FE 만 검증. 동시 다중 탭 시나리오 등 더 강한 보호가 필요하면 BE 가 `state` 를 단기 캐시(Redis)에 발급/소거하는 방식으로 보강 가능.

---

## 7. 다음 액션 (개발자 요청 정리)

- [ ] Kakao Developers 에서 앱 등록 + REST API 키 / Client Secret 발급 + Redirect URI 등록
- [ ] Google Cloud Console 에서 OAuth Client(웹) 생성 + Client ID / Secret 발급 + Redirect URI 등록
- [ ] 백엔드: `POST /api/v1/auth/oauth/{provider}` 엔드포인트 구현 (§2 스펙)
- [ ] 백엔드: `member_oauth_identity` 테이블 도입, `member.password` nullable 화 검토 (§3)
- [ ] FE 에 발급된 Client ID 전달 → `.env.local` / 배포 환경 변수 주입
- [x] 백엔드 구현 후 실서버 검증 절차(`../CLAUDE.md` §9) 수행 → `bandage-fe/.taskmaster/report/auth-oauth-api-verification-YYYY-MM-DD.md` 작성
