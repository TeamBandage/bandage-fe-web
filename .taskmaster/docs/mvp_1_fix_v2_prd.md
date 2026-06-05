<context>
# Overview
Bandage MVP 1차 보정 2 라운드(이하 mvp-1-fix-v2). 1 라운드(mvp-1-fix)에서 셸 / 마스터-디테일 / 인증 분리 / 모달 / 디스커버리·탭 분리까지 진행했지만 design/dist + design/figma-export 와 비교했을 때 여전히 디테일 격차가 크다. 이번 라운드는 백엔드 변경 의존도를 최소화하고 "프로토타입 디자인을 그대로 재현하는 것" 을 최우선으로 한다.

핵심 출처
- design/dist/* (HTML/CSS/JS 프로토타입, 시뮬레이션 가능)
- design/figma-export/screens/*.png (피그마 스크린샷)
- design/feedback.md (프로토타입 vs 코드 갭 분석)
- API_REQUIRED.md (1 라운드에서 발견한 백엔드 미비 항목)

# Goals
1. 밴드 상세 탭을 4 분할 (정보 / 멤버 / 일정·합주 / 밴드 관리) 하고 리더 전용 가시성 룰을 정확히 매칭한다.
2. 모든 도메인의 오류·빈상태 톤을 "서비스 준비 중" 계열로 완화한다 (빨간 ⚠️ 표시 제거 / 화면 신뢰성 보강).
3. 합주·공연·일정 변경 화면의 datetime-local 을 design/figma-export/screens/09-datetime-picker.png 의 캘린더 + 시·분 휠 모듈로 교체한다.
4. 카드/리스트/홈 그리딩 등 잡다한 UI 디테일(우측 도메인 아이콘, 홈 인사 문구, UUID 비노출 등) 을 프로토타입 그대로 일치시킨다.
5. mvp-1-fix-v2 종료 시 API_REQUIRED.md 가 백엔드 담당자(타 AI 또는 사람) 가 그대로 구현 착수 가능한 정돈된 명세 문서가 되어야 한다.

# Non-goals
- 백엔드 신규 API 직접 구현 (요청/응답 표준화 문서까지만)
- MFA(Micro-Frontend) 분리, 리얼 푸시 알림, 마이페이지 통계 등 MVP2 항목
- 프로필 사진 업로드, 공연 포스터 업로드 등 파일 업로드 (P2 로 보류)

# Audience & UX context
- 모바일/데스크톱 모두 지원하지만 디자인 정합성 최우선 단계 → lg(min-width:960px) 마스터-디테일 + 사이드바 기준
- 사용자: 밴드 리더/관리자/멤버, 비가입 사용자(밴드 탐색)
- 다크 테마 고정. 색·타이포·간격은 globals.css 의 디자인 토큰(--accent, --text-sub, --spacing-s-*) 기준만 사용

# Existing architecture (재사용 대상)
- src/components/ui/* — Card, Tabs, Dialog, ResponsiveSheet, StepIndicator, Avatar, Badge, RoleBadge, DateTimePicker, Skeleton, EmptyState
- src/components/layout/* — Shell, Sidebar, PaneSplit, PaneList, PaneDetail
- src/domain/* — band/practice/performance/member/auth 도메인 모듈 (api/hooks/types/components)
- TanStack Query (서버 상태) + Zustand authStore + react-hook-form + zod
- design/dist/css/screens.css 의 .home-item, .list-item, .home-header, .band-pill, .grid--3 패턴이 시각적 기준
- design/figma-export/screens/02-home.png, 03-band.png, 04-practice.png, 05-performance.png, 09-datetime-picker.png 가 시각적 기준

</context>
<PRD>
# Scope (Phases)

## Phase A — Foundation: 디자인 토큰 & 도메인 아이콘 확정
- design/dist/css/tokens.css, components.css, screens.css 와 src/app/globals.css 토큰을 비교, 누락된 시맨틱 토큰 보강 (예: --border-hi, --card-hover, --role-leader 톤)
- 도메인별 공식 아이콘 매핑 결정 후 lib/domain-icons.tsx 같은 단일 소스에서 export
  - 밴드 = lucide Music2 / Guitar (프로토타입 IconTile('guitar') 대응)
  - 합주 = lucide Clock3 (.icon-tile--success)
  - 공연 = lucide Rewind / Music (.icon-tile--amber)
  - 멤버 = Avatar fallback (이름 첫 글자) — UUID 직접 표기 금지
- 재사용 가능한 IconTile 컴포넌트 추가 (size: sm | md | lg, tone: accent | success | amber | warn | card)

## Phase B — 카드/리스트 우측 도메인 아이콘 일관화
- ListPane, HomeItem, BandCard, PracticeRow, PerformanceRow 등 모든 카드형 행에서 좌측이 아닌 "도메인 IconTile" 을 일관 적용 (디자인 프로토타입 기준)
- 호버/선택 시 .list-item.is-selected (accent-dim 배경 + 보조 보더) 룩 재현
- 프로토타입 색 가이드 그대로: 합주 success-dim, 공연 amber-dim
- 프로토타입의 hover transition 시간(--t-fast 0.12s) 과 box-shadow 톤을 그대로 매칭

## Phase C — 홈 화면 인사 / 헤더 / 통계 카드 재정렬
- "홈" / "오늘의 합주와 공연을 한눈에 확인하세요" 헤더 → "안녕하세요, {memberName} 님 👋" + "오늘도 좋은 합주 되세요." (design/dist/js/screens/home.js 의 home-header 그대로)
- memberName 은 useMe() (GET /api/v1/members/me) 의 name 필드를 사용. 비로그인/로딩 시 "안녕하세요 👋" 폴백
- HomeStatCards 그리드: 4 컬럼 (소속 밴드 / 예정 합주 / 예정 공연 / 참여 세션) — 데이터 미가용 항목은 숫자 자리에 "—" 또는 Skeleton
- 내 밴드 / 다가오는 합주 섹션: SectionTitle 의 "전체 보기 →" 액션을 ROUTES 그대로, home-item 시각 룩 정확히 재현
- "참여 세션" 통계는 백엔드 API 미존재 → mock 0 표시 + API_REQUIRED 항목으로 등록

## Phase D — 밴드 상세 탭 4 분할
탭 구성과 노출 규칙
- 정보 (info, 모두) — 프로필 이미지 / 밴드 이름 / 설명 / 통계(멤버 수, 예정 합주, 예정 공연 카드)
- 멤버 (members, 모두) — Avatar + 이름(name) + RoleBadge. 리더는 멤버 카드에서 위임/강등 액션 노출
- 일정 및 합주 (schedule, 모두) — UI 만 우선. "서비스 준비 중" empty state + API_REQUIRED 항목 #12 / #13 신설 (밴드별 합주/공연 목록)
- 밴드 관리 (manage, 리더 전용) — 가입 신청 승인/거절. ADMIN 도 노출하던 기존 동작은 LEADER 전용으로 좁힘 (RoleGuard role="LEADER")
탭 라벨/순서/접근성
- 라벨은 한글 그대로, 활성 탭은 .is-active 시각 토큰
- TabsList aria-label="밴드 상세 탭"
- 권한 미일치 탭은 DOM 자체에서 제거 (NotAllowed Empty State 대체 X)
구현 디테일
- design/dist/js/screens/band.js 의 isLeader, isAdmin 분기 룩을 그대로 따르되 본 라운드는 LEADER 만 manage 탭 노출
- 멤버 탭의 "리더 → 관리자/멤버 강등" UI 는 본 라운드는 read-only + 위임만 유지 (강등 API 미존재 → API_REQUIRED #14 추가)

## Phase E — 오류/빈상태 톤 완화
대상
- src/components/feedback/error-state.tsx
- src/app/error.tsx
- src/components/feedback/error-boundary.tsx
- ErrorState 를 사용하는 모든 호출 지점 (12 파일)
변경
- AlertTriangle / text-danger / 빨간 색 → 서비스 준비 중 톤 (Construction 또는 Wrench 아이콘 + text-foreground-sub)
- 기본 카피: "서비스를 준비하고 있어요" / "잠시 후 다시 시도하거나 다른 메뉴를 이용해 주세요." (description prop 으로 오버라이드 가능)
- 진짜 fatal 한 상황(예: app/error.tsx 의 unrecoverable) 만 약한 강조 톤(amber) 사용
- API 405/500 등도 동일 카피 노출 (사용자 입장에서 차이 없음)
- ErrorState role 은 그대로 alert 유지 (스크린리더 가이드라인 위배 X)

## Phase F — DateTimePicker 모달 전환
대상
- src/components/ui/date-time-picker.tsx (기존 native date input + Hour/Minute select)
- 모든 합주/공연/일정 변경 폼 (Practice/Performance Create modals, PracticeDetailContent 일정 변경, PerformanceDetailContent 일정 변경)
요건
- design/figma-export/screens/09-datetime-picker.png 와 일치하는 dialog 레이아웃
  - 좌측 캘린더 (월/이전 다음 네비, 일~토 헤더, 날짜 셀)
  - 우측 시간 휠 (시 / 분 두 컬럼, 5분 단위, 휠/스크롤 룩)
  - 하단 푸터: 선택 텍스트 (예: "2026.04.25 (토) 19:00") + 취소/확인 버튼
  - 상단 빠른 버튼 chip: 오늘 / 내일 / 다음 주
- 기존 DateTimePicker public API 유지 ("yyyy-MM-dd HH:mm" 문자열, value/onChange/required/disabled/step)
- 트리거: read-only Input 모양 — 클릭 시 ResponsiveSheet (lg=Dialog, mobile=BottomSheet) 오픈
- 키보드 접근성: 캘린더는 화살표 키 이동, Esc 닫기, Enter 확정. (접근성은 Phase H 에서 검증)
- date-fns + date-fns-tz Asia/Seoul 고정. 다른 타임존 절대 노출 X

## Phase G — UUID 비노출 / 멤버 표기 정상화
대상
- BandMemberRow.tsx (Member #{memberId})
- BandApplicationRow.tsx (Member #{memberId})
- PracticeDetailContent.client.tsx 의 참여자 카드 (Member #{memberId} + participantId 노출)
- 기타 toast / dialog / 디버그 텍스트
변경
- 응답에 name 이 있으면 name, 없으면 "멤버 #{memberId 마지막 4자리}" 형태로 폴백 (UUID 자체 노출 금지)
- participantId, sessionId 등 식별자 텍스트 노출 모두 삭제 (key prop 으로만 사용)
- 백엔드가 BandMemberInfoResponse / BandApplicationInfoResponse 에 name/profileImg 를 아직 안 주면 → API_REQUIRED #15, #16 으로 정리

## Phase H — 접근성 / 키보드 / 반응형 회귀 점검
- 마스터-디테일 패널 lg/모바일 양쪽에서 새 ListItem (도메인 IconTile + 홈 인사) 시각 정합성 확인
- DateTimePicker 모달 키보드 ↑/↓/←/→ 이동, Esc, Tab focus trap
- 새 카드/리스트의 hover/selected 상태가 전 페이지 동일한지 확인
- ErrorState 톤 변경 후 스크린리더 alert 우선순위 회귀 X
- 결과는 .taskmaster/report/mvp-1-fix-v2-audit-YYYY-MM-DD.md 로 정리

## Phase I — API_REQUIRED.md v2 정돈
종료 조건: 백엔드 담당(사람 또는 AI) 이 문서 단독으로 엔드포인트 명세 → 컨트롤러/서비스/DTO/예외 매핑까지 작성 가능해야 함.

문서 구조 표준화 (각 항목 공통 필드)
- ID (FE-API-XXX)
- 우선순위 (차단 / 신규 / 풍부화)
- HTTP method + path
- 요청 헤더 / Path / Query / Body (JSON 스키마 형태로)
- 응답: 성공/실패 케이스별 JSON 예시
- 에러 케이스 (HTTP code, message, 사유)
- 프론트 사용처 (파일/훅 이름)
- 현재 우회 방법 (mock / hide / disabled)
- 백엔드 작업 체크리스트 (DTO, Repository, 권한 체크, 테스트)

추가/갱신해야 할 항목
- FE-API-001 GET /api/v1/practices (1 라운드 차단 그대로 이관)
- FE-API-002 POST /api/v1/bands profileImg nullable
- FE-API-003 GET /api/v1/members/me 응답 필드 통일
- FE-API-004 GET /api/v1/bands?q&memberOnly&genre&sort
- FE-API-005 GET /api/v1/practices?q&memberOnly
- FE-API-006 GET /api/v1/performances?q&memberOnly
- FE-API-007 BandInfoResponse 풍부화 (genre, region, memberCount, status, foundedAt)
- FE-API-008 BandApplicationInfoResponse 풍부화 (applicantName, applicantProfileImg, message, rejectReason)
- FE-API-009 GET /api/v1/bands/{bandId}/practices (Phase D 일정·합주 탭)
- FE-API-010 GET /api/v1/bands/{bandId}/performances (Phase D 일정·합주 탭)
- FE-API-011 GET /api/v1/bands/{bandId}/stats (멤버 수, 예정 합주, 예정 공연 — Phase D 정보 탭 통계 카드)
- FE-API-012 BandMemberInfoResponse / 참여자 응답에 name, profileImg 포함
- FE-API-013 멤버 강등/강퇴 (DELETE /api/v1/bands/{bandId}/members/{bandMemberId} + role 변경)
- FE-API-014 홈 "참여 세션" 통계 (GET /api/v1/members/me/stats)
- FE-API-015 프로필 이미지 업로드 (P2, 항목 유지)
- FE-API-016 합주곡 검색/자동완성 (P2, 항목 유지)

# Technical Constraints
- 백엔드 변경 없이 동작 가능한 화면을 우선 완성. mock 으로 채우는 영역은 build/ts 에러 없이 통과해야 함
- 새 컴포넌트는 Card, Dialog, ResponsiveSheet 같은 기존 프리미티브 위에 얹어서 구현 (라이브러리 신규 의존 금지)
- 도메인 폴더 구조 (api/hooks/components/types) 유지. 카드/아이콘 등 도메인 횡단 컴포넌트는 components/ui/ 또는 components/feedback/
- E2E 회귀 위험을 줄이기 위해 data-slot 속성을 새 컴포넌트에도 부여
- 1 라운드에서 합의된 규칙 유지: lg breakpoint = 960px, 날짜는 KST "yyyy-MM-dd HH:mm", AlertTriangle 빨간 톤은 phase E 이후 더 이상 사용 X

# Logical Dependency Chain
1. Phase A (디자인 토큰 / IconTile) — 모든 UI 작업의 기반
2. Phase B (카드 우측 아이콘) — Phase A 의 IconTile 사용
3. Phase C (홈 인사) — 별도, member name API 사용. Phase A 결과(IconTile)도 활용
4. Phase D (밴드 상세 탭) — Phase A/B 의 IconTile + Tabs 사용. RoleGuard 정책 변경
5. Phase E (오류 톤) — 독립. 다만 Phase D 의 신규 empty state 도 일관 톤 적용
6. Phase F (DateTimePicker 모달) — 독립. 기존 폼들의 회귀 위험만 주의
7. Phase G (UUID 비노출) — Phase D/F 와 무관. 단독 진행 가능
8. Phase H (접근성/회귀) — A~G 작업 끝난 후 종합 점검
9. Phase I (API_REQUIRED v2) — 모든 phase 가 끝난 뒤 mock 으로 둔 자리를 검토하면서 작성. 핵심 항목은 phase 진행 중 즉시 stub 으로 추가 후 phase I 에서 정돈

# Risks & Mitigations
- 위험: ListItem 시각 변경이 모든 도메인 페이지에 파급 → 회귀 가능성 높음. → 완화: 기존 PracticeRow / BandCard 컴포넌트 단위로 PR 분리, 시각 회귀는 .taskmaster/report 의 viewport 캡처 비교
- 위험: 캘린더 모듈 자작은 시간 소요 큼. → 완화: 자작 후 단위 테스트(date-fns 기반 헬퍼) 작성, 폼 통합은 기존 DateTimePicker public API 그대로 유지해 호출부 변경 최소화
- 위험: 일정·합주 탭 (Phase D) 의 데이터 부재로 빈 상태가 됨. → 완화: 빈 상태 카피를 Phase E 의 "서비스 준비 중" 톤으로 명확히, API_REQUIRED 에 자세히 기재
- 위험: 백엔드가 name 필드를 아직 안 주는 상태에서 UUID 만 숨기면 사용자가 누가 누군지 식별 불가. → 완화: "멤버 #{memberId 마지막 4자리}" 폴백을 통일 적용

# Acceptance Criteria
- design/figma-export 와 비교했을 때 홈 / 밴드 상세 / 합주 / 공연 / 캘린더 모달 5 개 화면이 시각적으로 일치
- 모든 ErrorState/ErrorBoundary 가 빨간 톤 ⚠️ 없이 "서비스 준비 중" 톤으로 보임
- DateTimePicker 모달이 lg/mobile 모두 동작, 키보드 네비게이션 ok
- 화면에 UUID/Member #{full uuid} 가 보이지 않음
- API_REQUIRED.md 가 표준 템플릿대로 통일된 16+ 항목을 가짐
- pnpm lint / pnpm typecheck / pnpm test / pnpm build 통과

# Appendix — 출처 매핑
- 홈 인사 / home-header : design/dist/js/screens/home.js L9-L20, design/dist/css/screens.css L4-L7
- list-item / home-item 비주얼 : design/dist/css/screens.css L10-L69
- 밴드 탭 구성 : design/dist/js/screens/band.js L60-L86, design/feedback.md "5. 합주(Practice) 탭 분리" "3. 밴드 상세 내 세부 요소 누락"
- DateTimePicker 디자인 : design/figma-export/screens/09-datetime-picker.png
- 오류 톤 변경 근거 : 사용자 요구 (mvp-1-fix-v2 PRD 입력 항목 2)
- API_REQUIRED 갱신 근거 : .taskmaster/report/mvp-1-fix-integration-2026-04-25.md, design/feedback.md
</PRD>
