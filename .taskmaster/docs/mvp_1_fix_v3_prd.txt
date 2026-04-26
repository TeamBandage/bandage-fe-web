<context>
# Overview
Bandage MVP 1차 보정 3 라운드(mvp-1-fix-v3). 2 라운드(mvp-1-fix-v2)에서 셸/마스터-디테일/디자인 토큰/밴드 상세/DateTimePicker/UUID 비노출까지 완료했지만, 백엔드 `API_SPEC.md` 가 다음 항목들을 새롭게 제공하면서 프론트가 이를 반영하지 않으면 "내가 속하지 않은 리소스" 가 화면에 섞이거나 사용자 친화적이지 않은 UUID 입력 폼이 그대로 남는 문제가 있다. 또한 일부 생성 API 가 실제 호출 시 오류를 일으키는 케이스가 보고되어 검증 라운드가 필요하다.

이번 라운드는 (1) 신규 me 엔드포인트 정상 통합, (2) 생성 플로우 UX 재설계, (3) 인증 가드 정합성 점검, (4) 비밀번호 강도 카피 단순화, (5) 공연 참여 밴드 모달 검색 도입을 동시에 처리한다. 디자인 컨펌이 필요한 항목은 본 라운드 내에서 컨펌 의사 확인을 우선 진행한 뒤 구현한다.

핵심 출처
- API_SPEC.md (2026-04-25 업데이트, 특히 §3-3-1 `/bands/me` myRole, §4-1-1 `/practices/me`, §4-1-3 `/practices/me/search`, §6-2-1 `/performances/me`, §6-2-2 `/performances/search`, §3-3-2 `/bands/search`)
- API_REQUIRED.md (2 라운드 미해소 항목)
- design/handoff/* (2 라운드에서 정렬된 시각 기준)
- 사용자 피드백 (2026-04-25): "내가 속한 리소스만 노출 / 합주 생성 풀스크린 / 비밀번호 강도 단순화 / 공연 참여 밴드 모달 검색"

# Goals
1. 백엔드가 신규 제공한 me 엔드포인트(`/bands/me`, `/practices/me`, `/performances/me`)를 도메인 hook 으로 정식 분리하고, 기존 전체 목록 호출은 "탐색(Discovery)" 시나리오에만 한정한다.
2. 밴드 가입 신청(`POST /bands/{bandId}/applications`)은 **밴드 탐색 화면에서 외부 밴드 상세에 진입했을 때만** 활성화한다. 내가 이미 소속된 밴드 상세에서는 가입 버튼/토글이 노출되지 않는다.
3. 합주 사이드바 메뉴를 두 개의 서브 메뉴(`나의 합주` / `합주 시작하기`)로 분리하고, "합주 시작하기" 는 밴드 선택 → 곡 검색 → 메타데이터 입력의 다단계 풀스크린 플로우로 구현한다 (모달이 더 적합하다고 판단되면 본문에 별도 컨펌 후 진행).
4. 공연 생성 폼에서 `bandIds` UUID textarea 입력을 제거하고, 메타데이터(제목/장소/시간) 만으로 1차 생성을 가능하게 한 뒤, 별도 "참여 밴드 추가" 모달에서 밴드 검색 + 다중 선택 → `PATCH /performances/{id}` 또는 (백엔드 미지원 시) `POST /performances/{id}/bands` (요청 항목) 로 연동한다.
5. 비인증 사용자가 보호된 페이지(`/home`, `/bands`, `/practices`, `/performances`, `/me`) 에 직접 진입한 경우 즉시 `/login` 으로 리다이렉트되는지 미들웨어/클라이언트 가드 양쪽에서 검증·보강한다.
6. 비밀번호 강도 표시 카피를 `약함 / 보통 / 강함` 3단계 단순 라벨로 축약 (이유 부연 문장 제거).
7. 밴드/합주/공연 생성 API 의 실서버 호출 검증을 수행, `400/500/필수 필드 누락` 등 현 시점 실패 케이스를 리포트로 정리하고 프론트 측 보완 또는 백엔드 요청 항목으로 이관한다.

# Non-goals
- 백엔드 신규 API 직접 구현 (요청 사항은 검증 리포트와 API_REQUIRED.md 를 통해 정리만)
- 합주곡(Practice Song) 외부 검색 시스템 실연동 — 5-1 mock 응답 흐름 유지 (응답 자체는 5-1 결과를 5-3 `/practice-songs/from-song` 에 그대로 전달)
- MFA(Micro-Frontend) 분리, 푸시 알림, 마이페이지 통계 신규 카드, 프로필 이미지 업로드
- 기존 mvp-1-fix-v2 Phase H/I (접근성 회귀, API_REQUIRED v2 정돈) — 본 라운드 종료 후 별도로 이어 진행

# Audience & UX context
- 사용자: 밴드 리더 / 일반 멤버 / 비가입 사용자 (밴드 탐색)
- 다크 테마 고정. 모바일/데스크톱 모두 지원하지만 lg(960px) 마스터-디테일 패턴 우선
- 합주 시작하기 플로우는 "밴드 선택 → 곡 검색 → 메타데이터" 3 스텝. 각 스텝은 좌측 진행 상태(StepIndicator)/우측 메인 영역 구조

# Existing architecture (재사용 대상)
- src/global/api/apiClient — fetch 래퍼 + 401 refresh 인터셉터 + ApiError 매핑
- src/middleware.ts — refreshToken 쿠키 기반 라우트 보호 (현재 cookie 만 검사)
- src/global/auth/{useBandRole,RoleGuard,useAuthStore} — 권한/인증 헬퍼
- src/components/ui/{Tabs,Dialog,ResponsiveSheet,StepIndicator,Avatar,Badge,RoleBadge,DateTimePicker,IconTile,Skeleton,EmptyState,PasswordStrength}
- src/components/layout/{Shell,Sidebar,BottomNav,PaneSplit,PaneList,PaneDetail}
- src/hooks/useInfiniteCursor — 커서 페이징 통합 hook
- src/domain/{auth,member,band,practice,practice-song,performance} — 도메인 모듈
- TanStack Query, Zustand, react-hook-form + zod
- API_REQUIRED.md (2 라운드 종결 시점 형식)

</context>
<PRD>
# Scope (Phases)

## Phase A — 신규 me 엔드포인트 도메인 통합
대상
- src/domain/band/api/getMyBands.ts (신규) — `GET /api/v1/bands/me` 호출. 응답은 `MyBandInfoResponse`(myRole 포함) cursor list.
- src/domain/band/api/searchBands.ts (신규) — `GET /api/v1/bands/search?keyword=...`
- src/domain/band/types/res.ts — `MyBandInfoResponse extends BandInfoResponse { myRole: BandRole }` 추가
- src/domain/band/hooks/useMyBands.ts — 기존 `getBands` 첫페이지 우회 → `getMyBands` 로 교체. 응답 myRole 노출.
- src/domain/band/hooks/useBandList.ts — "탐색" 전용 힌트 주석 추가 (의미만 분리)
- src/domain/practice/api/getMyPractices.ts (신규) — `GET /api/v1/practices/me`
- src/domain/practice/api/searchMyPractices.ts (신규) — `GET /api/v1/practices/me/search?keyword=...`
- src/domain/practice/api/getPractices.ts — `bandId` 필수 인자로 재정의 (탐색용은 사용 안 함). 시그니처 변경 영향: 호출부에서 `bandId` 미제공 호출 차단.
- src/domain/practice/hooks/useMyPractices.ts (신규)
- src/domain/practice/hooks/useBandPractices.ts (신규) — `GET /api/v1/practices?bandId=` 래핑
- src/domain/performance/api/getMyPerformances.ts (신규) — `GET /api/v1/performances/me`
- src/domain/performance/api/searchPerformances.ts (신규) — `GET /api/v1/performances/search?keyword=...`
- src/domain/performance/hooks/useMyPerformances.ts (신규)
- src/global/auth/useBandRole.ts — `getBandMembers` 페이지네이션 우회 제거. `useMyBands` 의 myRole 매핑으로 단순화 (해당 bandId 가 me 목록에 없으면 null).

요건
- 모든 me 엔드포인트는 인증 필수, `apiClient` 의 401 → refresh 흐름 그대로 사용
- 신규 hook 들은 기존 `useInfiniteCursor` 시그니처 (`<T, C extends string>`) 재사용
- `useBandRole` 단순화 후 `RoleGuard`, `BandDetailContent` 등 호출부 변경 없이 동작 (반환 인터페이스 유지)
- ts strict 통과, eslint 통과

## Phase B — "내 리소스" / "탐색" 화면 정합성 정리
대상
- src/app/(main)/bands/page.tsx, src/app/(main)/bands/BandsList.client.tsx, src/app/(main)/bands/BandsListPane.client.tsx
- src/app/(main)/practices/page.tsx, src/app/(main)/practices/PracticesListPane.client.tsx
- src/app/(main)/performances/page.tsx, src/app/(main)/performances/PerformancesListPane.client.tsx
- src/app/(main)/home/HomeStatCards.client.tsx, src/app/(main)/home/HomeUpcomingPracticeSection.client.tsx (등 홈 섹션)
- src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx — 가입 신청 버튼 노출 조건

요건
- "내 밴드" 리스트는 `useMyBands` 결과를 바로 사용. 카드에 myRole 칩 노출 (LEADER/ADMIN/MEMBER) — design/handoff `band-list.md` 와 일치하도록 우측 RoleBadge 또는 좌측 Avatar 옆에 RoleBadge 작은 사이즈
- 밴드 탐색 탭은 `useBandList` 또는 신규 `useBandSearch` (keyword 입력 시) 사용. 내가 이미 소속된 밴드는 카드에 "이미 가입됨" 디스에이블 토글 표시
- 밴드 상세에서 가입 신청 버튼은 **현재 사용자가 멤버가 아닐 때 + 진입 경로가 탐색 탭일 때만** 노출.
  - 판정: `useMyBands` 결과에 해당 bandId 가 존재하지 않으면 비멤버. (네트워크 비용 최소화 위해 BandDetailContent 가 useMyBands hooks 결과를 함께 구독)
  - 이미 멤버인 경우 가입 신청 버튼/탭 자체 비노출. 대신 기존 "탈퇴" 동선 유지
- 홈 통계 카드 `소속 밴드` 는 `useMyBands().content.length` 사용. `다가오는 합주`/`다가오는 공연` 도 `useMyPractices`/`useMyPerformances` 사용 (전체 목록 X)
- 페이지/리스트 전환 시 기존 `useBandList` 훅의 fetcher signature 변경 없음(공개 API 유지). 단 호출부에서 prefetch 옵션이 me 와 분리되도록 queryKey 정합성 검증

## Phase C — 사이드바 합주 서브 메뉴 + 합주 시작하기 플로우
대상
- src/components/layout/sidebar.tsx — 합주 항목을 "expandable" 처리, 서브 메뉴 노출 (ROUTES 신설)
- src/components/layout/bottom-nav.tsx — 모바일은 "합주" 탭 클릭 시 기본 `나의 합주` 라우트로 이동 (서브 노출 X)
- src/global/config/routes.ts — `PRACTICES_ME`, `PRACTICES_NEW` 신설
- src/app/(main)/practices/page.tsx 현행 동작은 `나의 합주` 로 매핑 (URL 은 `/practices` 유지하고 내부적으로 me hook 사용 — 별 라우트 분리는 v3 에서는 하지 않음. 다만 사이드바 표기는 "나의 합주" 로)
- src/app/(main)/practices/new/* (신규 라우트) — 합주 시작하기 풀페이지

요건 — UX 의사결정 컨펌 절차
1. 우선 풀페이지 3-step (밴드 선택 → 곡 검색 → 메타데이터) 디자인을 design/handoff/practice-create.md (없으면 신설 보고) 에 따라 구현 시도
2. AI 가 풀페이지보다 모달 멀티 스텝이 더 적합하다고 판단할 경우, 작업 시작 전에 아래 비교를 사용자에게 제시하고 컨펌 받음:
   - 풀페이지 장단점, 모달 장단점, 디자인 시안 차이 (PaneSplit 영향)
   - 컨펌 후 채택안만 구현
3. 두 안 모두 React Hook Form 의 다단계 폼 (3 단계) + Zod schema 분리 + StepIndicator + 뒤로/이어가기 버튼 구조 사용

요건 — 구현 디테일
- Step 1 밴드 선택: `useMyBands` 결과를 BandPicker 그리드. 선택 시 zod 단계 검증, 다음 활성
- Step 2 곡 검색: 입력 → 디바운스 → `GET /api/v1/practice-songs/search?keyword=` 호출, 결과 카드 리스트. 자작곡 옵션 (5-2 직접 입력) 도 동일 화면 하단 토글
- Step 3 메타데이터: 합주 제목(선택), 장소(선택), 시작 시각(DateTimePicker), 진행 시간 (분 단위 정수)
- 제출:
  - 5-1 검색 결과 사용 → `POST /api/v1/practice-songs/from-song` (song 객체 그대로) → 응답의 songId 와 메타로 `POST /api/v1/practices` 호출
  - 자작곡 입력 → `POST /api/v1/practices` 시 `song` 필드에 songId 직접 입력 가능 → 우선 `POST /api/v1/practice-songs` (필드 입력) 먼저 수행 후 응답 songId 사용
- 성공 시 토스트 + `ROUTES.PRACTICE_DETAIL(practiceId)` 로 라우팅
- 실패 시 ErrorState 톤 (서비스 준비 중 mvp-1-fix-v2 Phase E 와 동일) — 단, 입력 검증 실패는 인라인 메시지

## Phase D — 비밀번호 강도 카피 단순화
대상
- src/components/ui/password-strength.tsx — `LABEL_MAP` 변경

요건
- 새 라벨: `empty: '비밀번호를 입력하세요'`, `weak: '약함'`, `medium: '보통'`, `strong: '강함'`
- 부연 설명 문장(`— 8자 이상 ...`) 모두 제거. 색상 토큰(weak=danger, medium=warn, strong=success) 유지
- 4-segment progress bar / aria 라벨 / score 평가 로직은 변경 없음
- 회원가입 폼/비밀번호 변경 폼 두 곳에서 회귀 없는지 시각 점검

## Phase E — 인증 가드 정합성 점검
대상
- src/middleware.ts (현재 refreshToken 쿠키 단일 검사)
- src/global/api/apiClient (401 → refresh → 실패 시 useAuthStore.clear + /login 이동)
- src/app/(main)/layout.tsx — 클라이언트 측 fallback gate (Suspense 안에서 useAuthStore + useMe)
- src/global/auth/AuthBootstrapper (또는 동등 컴포넌트, 없으면 신규)

요건
- 시나리오 검증
  - A) refreshToken 쿠키 무 → 미들웨어에서 즉시 `/login?from=...` 리다이렉트 (현 동작 유지)
  - B) refreshToken 쿠키 유 + accessToken 메모리 무 (페이지 직접 진입) → 진입 후 첫 보호 API 401 → refresh 1 회 → 성공 시 통과 / 실패 시 `/login`. 이때 화면이 깜빡(`/home` 잠깐 렌더 후 redirect) 하지 않도록 최상위 layout 에서 `useMe` 가 settled 될 때까지 Skeleton 으로 가드
  - C) 토큰 유효하나 사용자가 로그아웃했음 (BE 측 만료) → 401 → refresh 도 401 → /login 강제. 토스트: "세션이 만료되었습니다"
  - D) 미들웨어 통과 후 보호 페이지 마운트 → `useMe` 401 → AuthBootstrapper 가 useAuthStore.clear + replace('/login')
- 수정
  - `(main)/layout.tsx` 또는 신규 `<AuthBootstrapper>` 가 useMe (인증 필요) 를 호출하고 결과가 401/401-after-refresh 이면 즉시 redirect 후 children 렌더 차단
  - 401 토스트 중복 방지 (apiClient + AuthBootstrapper 양측에서 한 번만)
- 검증 — Playwright e2e 시나리오 4개 (A/B/C/D) 추가, 또는 실제 브라우저 dev 환경에서 step-by-step 수동 검증 결과 캡처

## Phase F — 공연 참여 밴드 모달 검색 도입
대상
- src/app/(main)/performances/new/PerformanceCreateForm.client.tsx — bandIds textarea 제거. 메타만으로 1차 생성
- src/domain/performance/components/PerformanceCreateModal.client.tsx — 동일
- src/domain/performance/components/PerformanceBandPickerModal.client.tsx (신규)
- src/domain/performance/api/{linkPerformanceBand.ts,unlinkPerformanceBand.ts} (신규 또는 PATCH 활용)
- src/app/(main)/performances/[performanceId]/* — 상세 화면에서 "참여 밴드 추가" 버튼 노출 (PerformanceManager 한정)

요건
- 1차 생성 페이로드에서 `bandIds` 미포함 (또는 빈 배열). API_SPEC §6-1 에 따라 빈 배열 허용됨
- 상세 화면에서 PerformanceManager 가 "참여 밴드 추가" 클릭 → 모달 오픈
- 모달 내부: keyword input → `GET /api/v1/bands/search` 디바운스 호출. 결과 카드에 체크박스 다중 선택 → 확인
- 연동 API
  - 백엔드 §6-4 `PATCH /performances/{id}` 의 Request Body 에 `bandIds: string[]` 필드 부재. 본 라운드는 다음 두 경로 중 하나 채택:
    - i) 기존 `PATCH /performances/{id}` 에 `bandIds` 필드 추가를 백엔드에 요청 (API_REQUIRED 신규 항목 FE-API-017)
    - ii) 임시: 단건씩 `POST /performances/{id}/practices/batch` 처럼 `POST /performances/{id}/bands/batch` 가 필요 — 동일하게 백엔드 요청
  - 본 라운드 구현은 mock fetcher (UI/UX 만 완성) + API_REQUIRED FE-API-017 등록. 실제 호출은 백엔드 구현 직후 hook fetcher 만 교체
- 모달 ESC/오버레이 닫기, 검색어 미입력 시 "탐색하려는 밴드명을 입력하세요" 가이드, 결과 0건 EmptyState

## Phase G — 생성 API 실서버 검증 + 리포트
대상
- 백엔드 `http://localhost:8080` (사용자가 기동)
- 검증 도메인: 밴드 생성, 합주 생성, 공연 생성 (필요 시 합주 생성에 전제되는 `practice-song` 흐름 포함)
- 산출물: `.taskmaster/reports/create-api-verification-2026-04-25.md`

요건 (CLAUDE.md "API 연동 태스크 완료 후 실제 서버 검증" 절차 그대로)
- 성공 케이스 (정상 요청)
- 인증/권한 경계 (Bearer 누락, 무효 토큰)
- 입력 유효성 실패 (필수 필드 누락, 포맷 위반)
- 상태 기반 실패 (이미 가입된 밴드 재가입 시도, 합주 생성 시 송 미존재, 공연 시작시각 과거)
- 응답 페이로드 + Set-Cookie + 백엔드 로그 (스택 트레이스) 원문 인용
- 발견된 이슈는 차단/기능저하/품질/참고 우선순위로 분류
- 차단 이슈는 본 라운드 후속 PR (Phase A/F 와 묶기) 에서 즉시 해결

## Phase H — API_REQUIRED.md v3 갱신
- Phase F 의 `bandIds` 일괄 추가 엔드포인트 신규 항목 FE-API-017 추가
- Phase A 로 해소된 항목 (FE-API-001, FE-API-006, FE-API-009, FE-API-010 일부) 의 상태를 `해소(2026-04-25)` 로 마킹
- Phase G 의 검증 결과로 발견된 신규 백엔드 요청 항목 등록
- 종료 조건: 백엔드 담당자가 본 문서만으로 작업 가능

# Technical Constraints
- 백엔드 변경 없이도 프론트가 빌드/타입체크 통과해야 함. me 엔드포인트는 실서버에서 200 OK 가 확인되면 hook 만 교체
- 새 hook 의 queryKey 는 `[domain, 'me', ...]` 네임스페이스로 분리해 캐시 충돌 방지
- 합주 생성 풀페이지 라우트는 `(main)` 그룹 안에 두되, master-detail PaneSplit 가 아닌 단일 패널 레이아웃 사용
- 공연 참여 밴드 모달은 ResponsiveSheet 또는 Dialog 위에 직접 구현 (라이브러리 신규 의존 금지)
- 모든 신규/수정 컴포넌트에 `data-slot` 부여
- 비밀번호 강도 라벨 변경은 PasswordStrength props 인터페이스 비파괴
- mvp-1-fix-v2 종료 시점의 디자인 토큰/시각 톤 유지

# Open Questions (사용자 컨펌 필요)
1. 합주 시작하기 — 풀페이지 vs 모달 멀티 스텝 (Phase C 의 컨펌 절차 참조)
2. 공연 참여 밴드 일괄 추가 — `PATCH bandIds` 확장 vs `POST /bands/batch` 신규 엔드포인트, 어느 형태를 백엔드에 요청할지
3. `/practices/new` URL 슬러그 (`/practices/new` vs `/practices/start`) — 사이드바 라벨 "합주 시작하기" 와의 일관성

</PRD>
