# Task ID: 8

**Title:** 생성 API 실서버 검증 및 리포트 + API_REQUIRED v3 갱신

**Status:** pending

**Dependencies:** 1, 2, 3, 4, 5

**Priority:** medium

**Description:** 밴드/합주/공연 생성 API의 실서버 호출 검증을 수행하고, 발견된 이슈를 `.taskmaster/reports/` 에 리포트로 정리한 뒤, API_REQUIRED.md 를 v3 로 갱신한다.

**Details:**

**검증 절차 (CLAUDE.md "API 연동 태스크 완료 후 실제 서버 검증" 준수):**

1. **백엔드 서버 기동 요청**: 사용자에게 `http://localhost:8080` 기동 요청

2. **검증 대상 엔드포인트:**
   - `POST /api/v1/bands` (밴드 생성)
   - `POST /api/v1/practices` (합주 생성)
   - `POST /api/v1/performances` (공연 생성)
   - `POST /api/v1/practice-songs/from-song` (합주곡 생성)
   - `POST /api/v1/practice-songs` (자작곡 생성)

3. **테스트 케이스:**
   - 성공 케이스 (정상 요청 → 200/201)
   - 인증 경계 (Bearer 누락, 무효 토큰)
   - 입력 유효성 실패 (필수 필드 누락, 포맷 위반)
   - 상태 기반 실패 (중복 생성, 합주 생성 시 song 미존재, 과거 시각)

4. **리포트 작성:**
   - `.taskmaster/reports/create-api-verification-2026-04-25.md`
   - 섹션: 메타, 테스트한 API 목록, 케이스별 요청/응답, 권장 조치, 프론트 관련 파일

5. **API_REQUIRED.md v3 갱신:**
   - Phase A 로 해소된 항목 (FE-API-001, 006, 009, 010 일부) 의 상태를 `해소(2026-04-25)` 마킹
   - Phase F 의 `bandIds` 일괄 추가 → FE-API-017 신규 항목 추가
   - 검증 결과로 발견된 신규 이슈 등록

**산출물:**
- `.taskmaster/reports/create-api-verification-2026-04-25.md`
- `API_REQUIRED.md` 업데이트

**Test Strategy:**

1. 모든 curl 요청 결과를 리포트에 원문 인용
2. 백엔드 스택 트레이스 (있을 경우) 함께 기록
3. 차단 이슈는 즉시 프론트 수정 또는 백엔드 요청 항목으로 분류
4. API_REQUIRED.md 가 백엔드 담당자가 바로 작업 가능한 수준으로 정리되었는지 검토
5. `pnpm lint` 통과 (마크다운 린트 제외)

## Subtasks

### 8.1. 백엔드 서버 기동 확인 및 검증 환경 준비

**Status:** pending  
**Dependencies:** None  

사용자에게 localhost:8080 백엔드 서버 기동을 요청하고, curl 검증을 위한 테스트 계정 셋업 및 토큰 확보를 수행한다.

**Details:**

1. 사용자에게 http://localhost:8080 백엔드 서버 기동 요청
2. 테스트 계정 생성: POST /api/v1/members/join (create-test-<timestamp>@bandage.test)
3. 로그인 및 accessToken 확보: POST /api/v1/auth/login
4. refreshToken 쿠키 확보 (Set-Cookie 헤더 파싱)
5. /tmp/bandage-create-api-test/ 디렉토리 생성 및 state.env 에 TOKEN, EMAIL, MEMBER_ID 저장
6. 기존 검증 리포트 패턴(band-api-verification-2026-04-24.md 등) 참조하여 동일 형식 준비

### 8.2. 5개 생성 API 엔드포인트 curl 검증 수행

**Status:** pending  
**Dependencies:** 8.1  

POST /api/v1/bands, POST /api/v1/practices, POST /api/v1/performances, POST /api/v1/practice-songs/from-song, POST /api/v1/practice-songs 총 5개 생성 API의 성공/실패 케이스를 curl로 검증한다.

**Details:**

검증 대상 엔드포인트:
1. POST /api/v1/bands - 성공(name/description/profileImg?), 실패(name 누락 400, Bearer 누락 401)
2. POST /api/v1/practices - 성공(title?/song/venue?/startAt/durationMinutes), 실패(song 미존재 404, 과거 startAt)
3. POST /api/v1/performances - 성공(title/bandIds?/startAt/durationMinutes/venue?), 실패(필수 필드 누락)
4. POST /api/v1/practice-songs/from-song - 성공(practiceId/song 객체), 실패(practiceId 미존재)
5. POST /api/v1/practice-songs - 자작곡 생성(practiceId/title/artist/album?/duration?/refLink?)

각 엔드포인트별 테스트 케이스:
- 정상 생성 (200/201)
- Bearer 누락 (401)
- 무효 토큰 (401)
- 필수 필드 누락 (400 + fieldErrors)
- 상태 기반 실패 (404 리소스 미존재, 409 중복 등)

### 8.3. 검증 리포트 작성 (.taskmaster/reports/create-api-verification-2026-04-25.md)

**Status:** pending  
**Dependencies:** 8.2  

curl 검증 결과를 CLAUDE.md에 명시된 검증 리포트 형식(메타/API 목록/케이스별 요청응답/권장 조치/프론트 관련 파일)으로 정리한다.

**Details:**

리포트 고정 섹션 구성:
1. 메타 - 작성일, 검증 주체, 대상 URL, 검증 도구, 검증 범위
2. 테스트한 API 목록 - path/method/인증요건/프론트 호출 지점/판정(정상/경고/실패) 표
3. 케이스별 실제 요청/응답 값 - 요청 헤더/body, 응답 HTTP/body/Set-Cookie, 관련 백엔드 로그를 원문 인용
4. 권장 조치 내용 및 검토 필요 사항 - 차단/기능저하/품질/참고 우선순위로 분류. 각 항목에 재현 절차/추정 원인/확인 체크리스트 포함
5. 프론트 관련 구현 지점 - 수정이 필요한 파일 경로
6. 재현용 페이로드 위치 - /tmp/bandage-create-api-test/ 경로 안내

기존 band-api-verification-2026-04-24.md, practice-song-api-verification-2026-04-24.md 형식을 참조하여 일관된 스타일 유지.

### 8.4. API_REQUIRED.md v3 갱신 (해소 항목 마킹 + 신규 이슈 등록)

**Status:** pending  
**Dependencies:** 8.3  

Phase A로 해소된 항목(FE-API-001, 006, 009, 010 일부)을 해소 마킹하고, Task 5의 bandIds 일괄 추가 관련 FE-API-017 신규 항목을 추가하며, 검증 결과로 발견된 신규 이슈를 등록한다.

**Details:**

API_REQUIRED.md 갱신 내역:

1. 해소 항목 마킹 (2026-04-25 기준):
   - 1번(GET /api/v1/practices) → API_SPEC 4-1-2로 해소 확인
   - 2번(POST /api/v1/bands profileImg) → API_SPEC 3-1에서 optional로 해소 확인
   - 필요시 검증 결과에 따라 추가 항목 해소 마킹

2. FE-API-017 신규 등록 (Task 5 관련):
   - POST /api/v1/performances/{performanceId}/bands/batch
   - 요청: { bandIds: string[] }
   - 용도: 공연에 참여 밴드 일괄 추가
   - 프론트 사용처: PerformanceBandPickerModal (검색→다중선택→확인)

3. 검증 결과 신규 이슈:
   - 발견된 스펙 드리프트, 누락 필드, 응답 불일치 등을 해당 우선순위(차단/기능저하/품질/참고) 섹션에 추가

### 8.5. 최종 검토 및 lint 통과 확인

**Status:** pending  
**Dependencies:** 8.3, 8.4  

생성된 리포트와 API_REQUIRED.md v3의 마크다운 문법, 내용 정합성을 검토하고 pnpm lint를 실행하여 프로젝트 린트 규칙 위반이 없는지 확인한다.

**Details:**

검토 체크리스트:
1. .taskmaster/reports/create-api-verification-2026-04-25.md 파일 존재 및 섹션 완성도
2. API_REQUIRED.md v3 갱신 사항:
   - 해소 항목에 날짜 마킹
   - FE-API-017 신규 항목 등록
   - 검증 결과 신규 이슈 등록
3. 마크다운 문법 검증 (표, 코드블록, 링크 등)
4. pnpm lint 실행 - TypeScript/ESLint 오류 없음 확인
5. 백엔드 담당자가 바로 작업 가능한 수준으로 정리되었는지 검토
6. 차단 이슈는 프론트 수정 또는 백엔드 요청 항목으로 명확히 분류되었는지 확인
