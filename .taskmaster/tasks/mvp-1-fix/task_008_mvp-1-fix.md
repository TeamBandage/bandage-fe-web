# Task ID: 8

**Title:** Practice/Performance 마스터-디테일 및 Me 재구성

**Status:** pending

**Dependencies:** 7

**Priority:** medium

**Description:** /practices, /performances 라우트에 Band와 동일한 마스터-디테일 패턴을 적용하고, /me 페이지를 데스크톱에서 pane-split(좌측 메뉴/우측 폼)으로 재구성한다.

**Details:**

1. Practice 마스터-디테일 (src/app/(main)/practices/):
   - layout.tsx: PaneSplit 적용
   - page.tsx: PaneList(340px) + 밴드 필터 드롭다운 + 합주 목록
   - [practiceId]/page.tsx: PaneDetail + 섹션(일정·장소, 곡 정보, 세션 grid, 참여자)
   - 모바일: Accordion으로 섹션 감싸 밀도 확보

2. Performance 마스터-디테일 (src/app/(main)/performances/):
   - layout.tsx: PaneSplit 적용
   - page.tsx: PaneList(340px) + 공연 목록
   - [performanceId]/page.tsx: PaneDetail + Cover + Info + Practice 연결 목록

3. Me 재구성 (src/app/(main)/me/):
   - 데스크톱: PaneList(좌측 메뉴: 내 정보/비밀번호 변경/로그아웃/탈퇴) + PaneDetail(선택된 섹션 폼)
   - 모바일: 기존 단일 스크롤 유지

4. SectionTitle, Divider 컴포넌트 활용하여 상세 페이지 섹션 구조화

5. Topbar 연동: 각 상세 페이지에서 제목/breadcrumb 표시

**Test Strategy:**

1. Practice/Performance/Me 각각 마스터-디테일 동작 확인
2. 상세 페이지 직접 URL 접근 시 정상 렌더링 확인
3. 모바일에서 기존 동작 유지 확인
4. Playwright E2E: 각 도메인 해피패스 데스크톱+모바일

## Subtasks

### 8.1. PaneSplit/PaneList/PaneDetail 레이아웃 컴포넌트 구현

**Status:** pending  
**Dependencies:** None  

데스크톱 마스터-디테일 레이아웃을 위한 핵심 Pane 컴포넌트들을 src/components/layout/에 구현한다.

**Details:**

1. src/components/layout/pane-split.tsx 구현:
   - flex 컨테이너로 좌/우 pane을 가로 배치
   - lg: 미만에서는 children만 렌더링 (모바일 유지)
   - lg: 이상에서 flex + overflow-hidden 적용

2. src/components/layout/pane-list.tsx 구현:
   - width prop으로 'default'(340px) 또는 'band'(360px) 지원
   - flex-shrink-0, border-right, overflow-y-auto
   - 모바일에서는 full-width로 동작

3. src/components/layout/pane-detail.tsx 구현:
   - flex-1, flex-col, overflow-hidden
   - 내부 body 영역 overflow-y-auto + padding
   - empty prop으로 EmptyPane 상태 지원

4. src/components/ui/section-title.tsx 구현:
   - 카드 내 섹션 헤딩 (텍스트 + 선택적 액션 슬롯)
   - text-subtitle 사이즈, foreground-sub 색상

5. design/dist/css/layout.css의 .pane-* 스타일을 Tailwind 유틸리티로 변환

### 8.2. Practice 마스터-디테일 레이아웃 적용

**Status:** pending  
**Dependencies:** 8.1  

/practices 라우트에 PaneSplit 패턴을 적용하여 데스크톱에서 좌측 목록 + 우측 상세 구조로 렌더링한다.

**Details:**

1. src/app/(main)/practices/layout.tsx 신규 생성:
   - 데스크톱(lg:): PaneSplit으로 children 감싸기
   - 모바일: children만 렌더링 (기존 동작 유지)

2. src/app/(main)/practices/page.tsx 수정:
   - PaneList(width='default', 340px) 내부에 밴드 필터 드롭다운 + 합주 목록 배치
   - 선택된 합주 없을 때 우측 EmptyPane 표시 로직 추가

3. src/app/(main)/practices/[practiceId]/page.tsx 수정:
   - PaneDetail 래퍼 적용
   - Topbar 연동 (제목에 합주명 표시)

4. PracticeDetailContent.client.tsx 섹션 구조화:
   - SectionTitle 컴포넌트로 '일정·장소', '합주곡', '세션', '참여자' 섹션 헤딩 추가
   - 모바일에서 Accordion으로 섹션 감싸 밀도 확보 (선택적)

5. URL 호환성 유지:
   - /practices 단독 접근: 좌측 목록 + 우측 EmptyPane
   - /practices/[id] 직접 접근: 좌측 목록 + 우측 해당 상세

### 8.3. Performance 마스터-디테일 레이아웃 적용

**Status:** pending  
**Dependencies:** 8.1  

/performances 라우트에 PaneSplit 패턴을 적용하여 데스크톱에서 좌측 목록 + 우측 상세 구조로 렌더링한다.

**Details:**

1. src/app/(main)/performances/layout.tsx 신규 생성:
   - 데스크톱(lg:): PaneSplit으로 children 감싸기
   - 모바일: children만 렌더링

2. src/app/(main)/performances/page.tsx 수정:
   - PaneList(width='default', 340px) 내부에 공연 목록 배치
   - 밴드 필터 드롭다운 유지 (기존 ?bandId= 쿼리 파라미터 활용)
   - 선택된 공연 없을 때 우측 EmptyPane 표시

3. src/app/(main)/performances/[performanceId]/page.tsx 수정:
   - PaneDetail 래퍼 적용
   - Topbar 연동 (제목에 공연명 표시)

4. PerformanceDetailContent.client.tsx 구조화:
   - Cover 영역 (공연 대표 이미지 또는 플레이스홀더)
   - Info 섹션 (일정, 장소, 설명)
   - Practice 연결 목록 섹션 (기존 '연결된 합주' 카드)
   - 기존 Tabs 구조 유지하면서 SectionTitle 활용

5. URL 호환성 유지:
   - /performances 단독 접근: 좌측 목록 + 우측 EmptyPane
   - /performances/[id] 직접 접근: 좌측 목록 + 우측 해당 상세

### 8.4. Me 페이지 데스크톱 Pane-split 재구성

**Status:** pending  
**Dependencies:** 8.1  

/me 페이지를 데스크톱에서 좌측 메뉴 + 우측 폼 구조로 재구성하고, 모바일에서는 기존 단일 스크롤을 유지한다.

**Details:**

1. src/app/(main)/me/layout.tsx 신규 생성:
   - 데스크톱(lg:): PaneSplit 적용
   - 모바일: children만 렌더링

2. src/app/(main)/me/page.tsx 수정:
   - 데스크톱 좌측 PaneList에 메뉴 항목 렌더링:
     - 내 정보 (profile)
     - 비밀번호 변경 (password)
     - 로그아웃 (logout)
     - 회원 탈퇴 (withdraw)
   - 선택된 메뉴에 따라 우측 PaneDetail 내용 변경
   - URL 쿼리 파라미터 또는 클라이언트 상태로 선택 메뉴 관리

3. MeContent.client.tsx 분리:
   - ProfileSection: 내 정보 조회/수정 폼
   - PasswordSection: 비밀번호 변경 폼 (기존 Link 대신 인라인)
   - LogoutSection: 로그아웃 확인 버튼
   - WithdrawSection: 회원 탈퇴 확인 다이얼로그

4. 모바일 동작 유지:
   - 기존 단일 스크롤 레이아웃 그대로
   - 메뉴 없이 모든 섹션 순차 표시

5. Topbar 연동: 'My Account' 또는 '내 정보' 제목 표시

### 8.5. Topbar 연동 및 반응형 통합 테스트

**Status:** pending  
**Dependencies:** 8.2, 8.3, 8.4  

Practice/Performance/Me 상세 페이지에 Topbar를 연동하고, 전체 마스터-디테일 패턴의 반응형 동작을 통합 테스트한다.

**Details:**

1. Topbar 컴포넌트 연동:
   - Practice 상세: Topbar에 합주 제목 + breadcrumb('합주 > {제목}')
   - Performance 상세: Topbar에 공연 제목 + breadcrumb('공연 > {제목}')
   - Me 상세: Topbar에 선택된 섹션명 표시

2. PaneDetail 내 Topbar 배치:
   - PaneDetail 상단에 sticky Topbar 렌더링
   - actions 슬롯에 편집/삭제 버튼 배치 (기존 카드 헤더에서 이동)

3. 반응형 동작 검증:
   - 960px 이상: 마스터-디테일 side-by-side 레이아웃
   - 960px 미만: 기존 풀스크린 스택 레이아웃
   - 브레이크포인트 전환 시 레이아웃 즉시 반영

4. URL 직접 접근 시나리오 검증:
   - /practices/[id], /performances/[id] 직접 접근 시 좌측 목록도 함께 로드
   - 뒤로가기 시 목록 상태 유지

5. Playwright E2E 테스트 시나리오 작성:
   - Practice 도메인 해피패스 (데스크톱+모바일)
   - Performance 도메인 해피패스 (데스크톱+모바일)
   - Me 도메인 해피패스 (데스크톱+모바일)
