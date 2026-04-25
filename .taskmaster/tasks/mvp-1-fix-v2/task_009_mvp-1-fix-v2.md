# Task ID: 9

**Title:** Phase I: API_REQUIRED.md v2 표준화 정돈

**Status:** pending

**Dependencies:** 1, 2, 3, 4, 5, 6, 7, 8

**Priority:** high

**Description:** Phase A~H에서 발견된 mock/우회 항목들을 포함하여 API_REQUIRED.md를 표준 템플릿으로 전면 재작성, 백엔드 담당자가 바로 구현 착수 가능한 명세 수준으로 정돈

**Details:**

1. 문서 구조 표준화 (각 항목 필수 필드):
   ```markdown
   ## FE-API-XXX: {엔드포인트 제목}
   - 우선순위: 차단 / 신규 / 풍부화
   - HTTP: GET/POST/PUT/DELETE {path}
   - 요청 헤더: Authorization: Bearer {accessToken}
   - Path 파라미터: {id} 설명
   - Query 파라미터: JSON 스키마
   - Request Body: JSON 스키마
   - Response 성공: JSON 예시
   - Response 실패: HTTP code, message, 사유
   - 프론트 사용처: 파일 경로, 훅 이름
   - 현재 우회 방법: mock / hide / disabled
   - 백엔드 체크리스트: DTO, Repository, 권한 체크, 테스트
   ```

2. 기존 항목 마이그레이션 (1~11):
   - FE-API-001: GET /api/v1/practices (차단)
   - FE-API-002: POST /api/v1/bands profileImg nullable
   - FE-API-003: GET /api/v1/members/me 필드 통일
   - ... (기존 11개 항목 재정리)

3. 신규 항목 추가:
   - FE-API-009: GET /api/v1/bands/{bandId}/practices (Phase D)
   - FE-API-010: GET /api/v1/bands/{bandId}/performances (Phase D)
   - FE-API-011: GET /api/v1/bands/{bandId}/stats (Phase D 정보 탭)
   - FE-API-012: BandMemberInfoResponse name/profileImg (Phase G)
   - FE-API-013: 멤버 강등/강퇴 API (Phase D)
   - FE-API-014: GET /api/v1/members/me/stats (Phase C 참여 세션)
   - FE-API-015: 프로필 이미지 업로드 (P2)
   - FE-API-016: 합주곡 검색 (P2)

4. 총 16개 이상 항목 정리

**Test Strategy:**

1. 각 API 항목의 필수 필드 존재 확인
2. JSON 스키마 유효성 검증
3. 프론트 사용처 파일 경로 실제 존재 확인
4. 백엔드 담당자 리뷰 (문서 단독 이해 가능 여부)
5. pnpm build 통과 (타입 에러 없음)

## Subtasks

### 9.1. API_REQUIRED.md 표준 템플릿 정의 및 문서 구조 수립

**Status:** pending  
**Dependencies:** None  

백엔드 담당자가 바로 구현 착수 가능하도록 API_REQUIRED.md의 표준 템플릿을 정의하고 문서 전체 구조를 수립합니다.

**Details:**

1. API_REQUIRED.md 파일 최상단에 문서 목적/배경/활용법 섹션 작성:
   - 작성일, 영향 범위, 참조 출처(mvp-1-fix-v2 PRD, design/feedback.md 등)
   - 백엔드 담당자 활용 가이드 (문서만으로 DTO/Repository/Controller 작성 가능해야 함)

2. 각 API 항목 표준 템플릿 필드 정의:
   - ID: FE-API-XXX 형식
   - 우선순위: 차단 | 신규 | 풍부화
   - HTTP: GET/POST/PUT/DELETE {path}
   - 요청 헤더: Authorization, Cookie 등
   - Path 파라미터: {id} 설명
   - Query 파라미터: JSON 스키마
   - Request Body: JSON 스키마
   - Response 성공: HTTP status + JSON 예시
   - Response 실패: HTTP code, message, 사유
   - 프론트 사용처: 파일 경로, 훅 이름
   - 현재 우회 방법: mock | hide | disabled
   - 백엔드 체크리스트: DTO 생성, Repository 메서드, 권한 체크, 단위 테스트

3. 문서 섹션 구조화:
   - 차단 (Blocking) — 기존 기능 막힘
   - 신규 (New Feature) — 신규 기능에 필요
   - 풍부화 (Enrichment) — 기존 응답 확장
   - P2 보류 — 향후 구현 예정

4. 참고용 마이그레이션 체크리스트 섹션 추가

### 9.2. 기존 API 항목 1~8 표준 템플릿 마이그레이션

**Status:** pending  
**Dependencies:** 9.1  

기존 API_REQUIRED.md의 1~11 항목 중 FE-API-001~008을 새 표준 템플릿으로 마이그레이션합니다.

**Details:**

1. FE-API-001: GET /api/v1/practices (차단)
   - 현재 응답: 405 지원하지 않는 HTTP 메서드
   - 요청: CursorResponse<PracticeListItemResponse> 형태
   - 프론트 사용처: domain/practice/api/getPractices.ts, usePractices, 홈 다가오는 합주
   - 우회: ErrorState로 빈 상태 표시

2. FE-API-002: POST /api/v1/bands profileImg nullable (차단)
   - 요청: CreateBandRequest.profileImg?: string
   - 프론트 사용처: domain/band/api/createBand.ts, BandCreateModal
   - 우회: 항상 빈 문자열 전송

3. FE-API-003: GET /api/v1/members/me 필드 통일 (차단)
   - 현재 응답: memberId, 프론트 기대: id
   - 프론트 사용처: domain/member/api/getMe.ts, useMe, 홈 인사 문구
   - 우회: memberId를 id로 매핑

4. FE-API-004: GET /api/v1/bands 검색 파라미터 (신규)
   - Query: q, memberOnly, genre, sort
   - 프론트 사용처: useDiscoverySearch (Task 18 디스커버리)
   - 우회: 클라이언트 필터링

5. FE-API-005: GET /api/v1/practices 검색 파라미터 (신규)
   - Query: q, memberOnly
   - 프론트 사용처: 합주 디스커버리
   - 우회: 클라이언트 필터링

6. FE-API-006: GET /api/v1/performances 검색 파라미터 (신규)
   - Query: q, memberOnly
   - 프론트 사용처: 공연 디스커버리
   - 우회: 클라이언트 필터링

7. FE-API-007: BandInfoResponse 풍부화 (풍부화)
   - 추가 필드: genre, region, memberCount, status, foundedAt
   - 프론트 사용처: BandCard, 밴드 상세 정보 탭

8. FE-API-008: BandApplicationInfoResponse 풍부화 (풍부화)
   - 추가 필드: applicantName, applicantProfileImg, message, rejectReason
   - 프론트 사용처: BandApplicationRow

### 9.3. Phase D 밴드 상세 및 Phase C 홈 관련 신규 API 항목 추가 (FE-API-009~014)

**Status:** pending  
**Dependencies:** 9.1  

Phase D 밴드 상세 탭 분리와 Phase C 홈 화면에서 필요한 신규 API 항목 6개를 표준 템플릿으로 작성합니다.

**Details:**

1. FE-API-009: GET /api/v1/bands/{bandId}/practices (신규)
   - 용도: Phase D '일정 및 합주' 탭
   - HTTP: GET /api/v1/bands/{bandId}/practices?lastId=&pageSize=
   - Path: bandId (UUID)
   - Response: ApiResponse<CursorResponse<PracticeListItemResponse>>
   - 프론트 사용처: BandDetailContent 일정 및 합주 탭
   - 우회: EmptyState '서비스 준비 중'

2. FE-API-010: GET /api/v1/bands/{bandId}/performances (신규)
   - 용도: Phase D '일정 및 합주' 탭
   - HTTP: GET /api/v1/bands/{bandId}/performances?lastId=&pageSize=
   - Path: bandId (UUID)
   - Response: ApiResponse<CursorResponse<PerformanceListItemResponse>>
   - 프론트 사용처: BandDetailContent 일정 및 합주 탭
   - 우회: EmptyState '서비스 준비 중'

3. FE-API-011: GET /api/v1/bands/{bandId}/stats (신규)
   - 용도: Phase D 정보 탭 통계 카드
   - HTTP: GET /api/v1/bands/{bandId}/stats
   - Response: { memberCount, upcomingPractices, upcomingPerformances }
   - 프론트 사용처: BandDetailContent 정보 탭 StatCards
   - 우회: mock 0 표시 또는 Skeleton

4. FE-API-012: BandMemberInfoResponse name/profileImg 필드 (풍부화)
   - 용도: Phase G UUID 비노출
   - 추가 필드: name, profileImg
   - 프론트 사용처: BandMemberRow, PracticeDetailContent 참여자
   - 우회: 'Member #{last4Chars}' 폴백

5. FE-API-013: 멤버 강등/강퇴 API (신규)
   - 용도: Phase D 멤버 탭 리더 전용 액션
   - HTTP: DELETE /api/v1/bands/{bandId}/members/{bandMemberId}
   - HTTP: PATCH /api/v1/bands/{bandId}/members/{bandMemberId} (role 변경)
   - 프론트 사용처: BandMemberRow 강등/강퇴 버튼
   - 우회: 버튼 disabled + tooltip '준비 중'

6. FE-API-014: GET /api/v1/members/me/stats (신규)
   - 용도: Phase C 홈 '참여 세션' 통계
   - HTTP: GET /api/v1/members/me/stats
   - Response: { totalBands, upcomingPractices, upcomingPerformances, participatingSessions }
   - 프론트 사용처: HomeStatCards '참여 세션' 카드
   - 우회: mock 0 또는 '—' 표시

### 9.4. P2 보류 항목 및 활성화 절차/우회 현황 테이블 작성

**Status:** pending  
**Dependencies:** 9.2, 9.3  

P2 보류 항목(FE-API-015~016)을 추가하고, 백엔드 구현 완료 시 활성화 절차 및 프론트 mock/우회 현황 테이블을 정리합니다.

**Details:**

1. FE-API-015: 프로필 이미지 업로드 (P2)
   - HTTP: POST /api/v1/members/me/profile-image (멀티파트)
   - 또는 사전 서명 URL 방식 (GET /presigned-url → S3 직접 업로드)
   - 밴드 동일: POST /api/v1/bands/{bandId}/profile-image
   - 프론트 사용처: 프로필 편집, 밴드 생성/편집
   - 현재: URL 텍스트 입력 폼 유지

2. FE-API-016: 합주곡 검색/자동완성 (P2)
   - HTTP: GET /api/v1/practice-songs?q=
   - Response: { content: PracticeSong[], hasNext }
   - 프론트 사용처: PracticeCreateModal 곡 선택
   - 현재: songId UUID 직접 입력 폼 유지

3. 활성화 절차 섹션 작성:
   - 백엔드가 엔드포인트 구현 완료 시
   - 프론트 domain/{name}/api/ fetcher 시그니처 갱신
   - useDiscoverySearch 등 mock 대체 훅의 fetcher 교체
   - .taskmaster/report/ 에서 후속 검증 라운드 실시

4. 프론트 mock/우회 현황 테이블 갱신:
   | 영역 | 우회 방법 | 관련 FE-API |
   | 밴드 검색 | 클라이언트 필터 | FE-API-004 |
   | 내 소속/탐색 탭 | memberOnly 미지원 | FE-API-004~006 |
   | 합주 목록 | 405 차단 | FE-API-001 |
   | 밴드별 합주/공연 | EmptyState | FE-API-009~010 |
   | 참여 세션 통계 | mock 0 | FE-API-014 |
   | 멤버 이름 | last4Chars 폴백 | FE-API-012 |
   | 프로필 사진 | URL 입력 | FE-API-015 |
   | 합주곡 검색 | UUID 입력 | FE-API-016 |

5. 총 16개 항목 최종 검증:
   - FE-API-001 ~ FE-API-016 존재 확인
   - 각 항목 필수 필드 완비 확인
   - pnpm build 통과 확인 (타입 에러 없음)
