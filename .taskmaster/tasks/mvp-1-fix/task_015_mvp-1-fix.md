# Task ID: 15

**Title:** 실서버 연동 검증 리포트 작성 (실데이터 시나리오)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 현재 develop 까지 반영된 프론트 구현을 로컬 백엔드(http://localhost:8080)와 실제로 연결해 주요 기능(가입/로그인/밴드/합주/공연/온보딩)을 실데이터로 돌리고, 성공/실패·관찰값을 .taskmaster/report/mvp-1-fix-integration-YYYY-MM-DD.md 에 정리한다.

**Details:**

1) 백엔드 서버 기동 후 curl 대신 프론트 Playwright + 실사용 스크립트로 각 엔드포인트를 직접 호출. 2) 검증 시나리오: (a) /join → /login → /me (b) 밴드 생성 → 목록 → 상세 이동 (c) 가입 신청 → 리더 승인 → 멤버 반영 (d) 합주 생성 → 세션 편성 → 장소 변경 → 삭제 (e) 공연 생성 → 합주 일괄 연결 → 상세 진행도 확인 (f) 비인증 / → /onboarding 리다이렉트 (g) 비밀번호 변경 플로우. 3) 실패 케이스는 HTTP status + ApiResponse body + 백엔드 로그 발췌 기록. 4) 최종 보고서 구조: 메타 / 시나리오별 요약 표 / 성공·실패 상세 / 🔴 차단 / 🟠 품질 이슈 / 후속 조치. 5) 이 태스크는 UI 코드 변경을 수반하지 않으며 리포트 파일만 커밋.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 15.1. 백엔드 서버 기동 및 E2E 환경 준비

**Status:** done  
**Dependencies:** None  

로컬 백엔드(http://localhost:8080) 기동 상태 확인 및 Playwright E2E 테스트 환경 준비

**Details:**

1) 사용자에게 백엔드 서버(http://localhost:8080) 기동 요청 및 상태 확인
2) 프론트 개발 서버(pnpm dev) 기동 확인 (localhost:3000 또는 3100)
3) Playwright 설정 검증 (playwright.config.ts 확인)
4) 기존 4개 검증 리포트 확인: auth-member, band, practice-song, performance
5) 검증 시나리오별 테스트 데이터 준비 (이메일 suffix 생성용 timestamp)
6) 재현용 페이로드 디렉토리 생성 (/tmp/mvp-1-fix-integration-test/)

### 15.2. 인증/회원 시나리오 실데이터 검증

**Status:** done  
**Dependencies:** 15.1  

회원가입(/join) → 로그인(/login) → 내 정보(/me) → 비밀번호 변경 플로우 전체 검증

**Details:**

1) 시나리오 (a): POST /api/v1/members/join → POST /api/v1/auth/login → GET /api/v1/members/me
2) 기존 이슈 재검증: GET /members/me의 data:null 응답 현황
3) 403 vs 401 경계 확인: Bearer 누락/무효 토큰의 실제 응답 코드
4) 시나리오 (g): 비밀번호 변경 플로우 (PATCH /api/v1/auth/password)
5) 토큰 재발급 검증: POST /api/v1/auth/refresh 쿠키 기반 호출
6) 비인증 사용자의 / → /onboarding 리다이렉트 확인 (시나리오 f)
7) 각 요청/응답 페어 기록 (HTTP status, body, Set-Cookie)

### 15.3. 밴드/합주/공연 CRUD 시나리오 실데이터 검증

**Status:** done  
**Dependencies:** 15.2  

밴드 생성 → 목록 → 상세 이동, 합주 생성 → 세션 편성, 공연 생성 → 합주 연결 플로우 검증

**Details:**

1) 시나리오 (b): 밴드 생성(POST /bands) → 목록(GET /bands) → 상세(GET /bands/{id})
2) 시나리오 (c): 가입 신청 → 리더 승인 → 멤버 반영 (applications 엔드포인트)
3) 시나리오 (d): 합주 생성(POST /practices) → 세션 편성 → 장소 변경 → 삭제
   - 기존 블로커 확인: GET /api/v1/practices 미구현 이슈
   - 유효 songId 확보 후 합주 생성 시도
4) 시나리오 (e): 공연 생성 → 합주 일괄 연결 → 상세 진행도 확인
   - 기존 이슈 확인: PATCH /performances/{id} 부분 업데이트 불가
5) 역할 기반 권한 검증 (LEADER/ADMIN/MEMBER)

### 15.4. 실패 케이스 수집 및 백엔드 로그 분석

**Status:** done  
**Dependencies:** 15.2, 15.3  

모든 검증 시나리오의 실패 케이스에 대해 HTTP status + ApiResponse body + 백엔드 로그 발췌 기록

**Details:**

1) 시나리오 2, 3에서 발생한 모든 실패 케이스 정리
2) 각 실패에 대해 HTTP status code, ApiResponse body 전문 기록
3) 백엔드 애플리케이션 로그에서 관련 스택 트레이스 발췌
4) 기존 리포트의 미해결 이슈 재확인:
   - GET /api/v1/practices 미구현 (401 + Allow:POST)
   - GET /api/v1/members/me 응답 data:null
   - PATCH /api/v1/performances/{id} 부분 업데이트 불가
   - 403 vs 401 경계 분리 여부
5) 우선순위별 분류: 차단(P0) / 기능저하(P1) / 품질(P2) / 참고

### 15.5. 통합 검증 리포트 작성 및 커밋

**Status:** done  
**Dependencies:** 15.4  

.taskmaster/report/mvp-1-fix-integration-YYYY-MM-DD.md 파일 작성 및 커밋

**Details:**

1) 리포트 구조 작성:
   - 메타: 작성일, 검증 주체, 대상 URL, 검증 도구, 검증 범위
   - 시나리오별 요약 표: 7개 시나리오(a~g)의 경로/판정
   - 성공/실패 상세: 케이스별 실제 요청/응답 값
   - 차단 이슈(P0), 기능저하 이슈(P1), 품질 이슈(P2) 분류
   - 후속 조치: 프론트 단독 수정 vs 백엔드 요청 사항
2) 기존 4개 리포트(auth-member, band, practice-song, performance)와 연계
3) 재현용 페이로드 위치 기록 (/tmp/mvp-1-fix-integration-test/)
4) git add + commit (커밋 메시지: 'test: Task 15 실서버 연동 검증 리포트 작성')
5) UI 코드 변경 없음 확인 (리포트 파일만 커밋)
