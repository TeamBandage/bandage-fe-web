# Task ID: 20

**Title:** Band/Practice/Performance 상세 화면 탭 분리

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 현재 수직 카드 나열 형태의 상세 화면을 프로토타입처럼 '정보/멤버/신청 현황' (Band), '개요/세션/참가자/곡' (Practice), '개요/연결 합주/참여 밴드' (Performance) 의 Tabs 구조로 재구성한다.

**Details:**

1) Band 상세: Tabs(정보 / 멤버 / 가입 신청). LEADER/ADMIN 만 가입 신청 탭 노출 (RoleGuard). 2) Practice 상세: Tabs(개요·일정·장소·곡 / 세션 편성 / 참가자). 3) Performance 상세: Tabs(개요·일정·장소 / 연결 합주 / 참여 밴드 chips). 4) 기존 BandDetailContent / PracticeDetailContent / PerformanceDetailContent 의 섹션을 잘라 탭 컴포넌트 하위 컨텐츠로 이동. 5) 탭 활성 상태는 URL hash (#info, #members, #applications, #sessions, #participants 등) 동기화. 6) 모바일에서도 동일 탭 동작. 7) 스냅샷 테스트 1~2 개 + Playwright 가드는 기존 유지.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 20.1. URL hash 기반 탭 상태 동기화 훅 구현 (useHashTab)

**Status:** pending  
**Dependencies:** None  

탭 상태를 URL hash fragment (#info, #members 등)와 양방향 동기화하는 커스텀 훅을 구현합니다.

**Details:**

src/hooks/useHashTab.ts 파일 생성. Next.js useRouter/usePathname과 window.location.hash를 조합하여 탭 상태 관리. 기능: (1) 초기 로드 시 hash에서 탭 값 읽기, (2) 탭 변경 시 hash 업데이트 (history.replaceState 사용으로 뒤로가기 오염 방지), (3) hash 없을 때 defaultTab 반환, (4) 유효하지 않은 hash일 때 fallback 처리. 반환값: [activeTab, setActiveTab] 형태의 tuple. Radix Tabs의 value/onValueChange와 호환되도록 설계.

### 20.2. PracticeDetailContent 탭 구조 재구성 (개요/곡/세션/참여자)

**Status:** pending  
**Dependencies:** 20.1  

Practice 상세 화면을 현재 수직 Card 나열에서 4개 탭 구조로 변환합니다.

**Details:**

src/app/(main)/practices/[practiceId]/PracticeDetailContent.client.tsx 수정. (1) Tabs 컴포넌트 import 및 useHashTab 훅 적용, (2) 탭 구성: 'overview' (제목/일정/장소), 'song' (합주곡 정보/refLink), 'sessions' (세션 목록/생성 폼), 'participants' (참여자 목록/추가 폼), (3) 기존 Card 섹션을 TabsContent 하위로 이동, (4) 각 탭별 컴포넌트 분리: PracticeOverviewTab, PracticeSongTab, PracticeSessionsTab, PracticeParticipantsTab (같은 파일 또는 별도 파일), (5) hash 기본값: 'overview', (6) 모바일에서도 동일한 탭 UI 동작 유지

### 20.3. PerformanceDetailContent 탭 구조 재구성 (개요/연결 합주/참여 밴드)

**Status:** pending  
**Dependencies:** 20.1  

Performance 상세 화면을 3개 탭 구조로 변환하고 hash 동기화를 적용합니다.

**Details:**

src/app/(main)/performances/[performanceId]/PerformanceDetailContent.client.tsx 수정. (1) 메인 콘텐츠에 Tabs 컴포넌트 적용 및 useHashTab 훅 연동, (2) 탭 구성: 'overview' (제목/D-day/일정/장소), 'practices' (연결된 합주 목록 + '합주 연결' 버튼), 'bands' (참여 밴드 chips), (3) 기존 Card 섹션을 TabsContent로 재배치, (4) isManager 조건부 UI(수정/삭제/합주연결 버튼)는 해당 탭 내 유지, (5) AttachDialog 내부의 Tabs는 기존 유지 (batch/new 선택용), (6) hash 기본값: 'overview'

### 20.4. BandDetailContent hash 동기화 적용 및 탭 구조 보정

**Status:** pending  
**Dependencies:** 20.1  

기존 Band 상세 화면의 Tabs에 useHashTab 훅을 적용하여 URL hash 동기화를 추가합니다.

**Details:**

src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx 수정. (1) 기존 defaultValue='overview'를 useHashTab 훅으로 교체, (2) hash 값: 'overview', 'members', 'applications', (3) canSeeApplications 조건에 따라 applications hash 접근 시 권한 없으면 overview로 fallback, (4) RoleGuard 로직 유지, (5) 탭 라벨 확인: '개요' → 'info' hash로 매핑 가능 (프로토타입 명세 '정보/멤버/가입 신청'과 일치), (6) LEADER/ADMIN 권한 체크는 기존 hasRole 함수 사용

### 20.5. 스냅샷 테스트 추가 및 기존 Playwright 가드 검증

**Status:** pending  
**Dependencies:** 20.2, 20.3, 20.4  

변경된 상세 화면들에 대한 Vitest 스냅샷 테스트를 추가하고 기존 E2E 테스트 통과를 확인합니다.

**Details:**

(1) Vitest 스냅샷 테스트 추가: PracticeDetailContent (각 탭 상태별 1-2개), PerformanceDetailContent (각 탭 상태별 1-2개), BandDetailContent (hash 적용 후 스냅샷 갱신), (2) 테스트 위치: src/app/(main)/practices/__tests__/, src/app/(main)/performances/__tests__/, src/app/(main)/bands/__tests__/, (3) 기존 Playwright E2E 테스트 실행 (pnpm test:e2e)하여 회귀 확인, (4) 필요시 E2E 테스트에 hash 기반 탭 네비게이션 시나리오 추가, (5) pnpm typecheck && pnpm lint && pnpm test 전체 통과 확인
