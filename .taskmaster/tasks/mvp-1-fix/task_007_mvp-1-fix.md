# Task ID: 7

**Title:** Band 마스터-디테일 레이아웃 구현

**Status:** pending

**Dependencies:** 3 ✓, 5

**Priority:** medium

**Description:** /bands와 /bands/[bandId] 라우트를 데스크톱에서 마스터-디테일 구조로 렌더링한다. 좌측 PaneList(360px)에 검색+필터+밴드 목록, 우측 PaneDetail에 선택된 밴드 상세(탭: 정보/멤버/신청 현황)를 표시한다.

**Details:**

1. src/app/(main)/bands/layout.tsx 생성:
   - 데스크톱(lg:): PaneSplit 컴포넌트로 감싸기
   - 모바일: 기존처럼 children만 렌더

2. src/app/(main)/bands/page.tsx 수정:
   - 데스크톱: PaneList(width='band-list') 안에 검색 + 필터 chips + BandCard 목록
   - 선택된 밴드가 없으면 우측에 EmptyPane 표시
   - 모바일: 기존 목록 페이지 유지

3. src/app/(main)/bands/[bandId]/page.tsx 수정:
   - 데스크톱: PaneDetail 안에 Topbar(밴드명) + 탭(정보/멤버/신청 현황)
   - 모바일: 기존 상세 페이지 유지

4. URL 호환성 유지:
   - /bands 단독 접근: 좌측 목록 + 우측 EmptyPane
   - /bands/[bandId] 직접 접근: 좌측 목록 + 우측 해당 밴드 상세

5. RoleBadge 컴포넌트를 밴드 카드/멤버 목록에 적용

6. 역할 가드(RoleGuard) 유지: 가입 신청 탭, 승인/거절 버튼

**Test Strategy:**

1. /bands URL 접근 시 좌측 목록 + 우측 EmptyPane 확인
2. 밴드 클릭 시 URL 변경 없이 우측 상세 갱신(데스크톱) 확인
3. /bands/[bandId] 직접 URL 접근 시 정상 렌더링 확인
4. 모바일에서 기존 목록→상세 풀스크린 이동 확인
5. Playwright E2E: Band 도메인 해피패스 데스크톱+모바일

## Subtasks

### 7.1. 마스터-디테일 레이아웃 컴포넌트 생성 (PaneSplit, PaneList, PaneDetail)

**Status:** pending  
**Dependencies:** None  

데스크톱 마스터-디테일 구조를 위한 핵심 레이아웃 컴포넌트들을 src/components/layout/에 구현한다. lg: 브레이크포인트(960px)에서 좌우 분할, 그 미만에서는 children만 렌더링하는 반응형 처리를 포함한다.

**Details:**

1. src/components/layout/pane-split.tsx 생성:
   - props: { children: ReactNode }
   - 데스크톱(lg:): flex w-full h-[calc(100vh-env(safe-area-inset-top))] overflow-hidden
   - 모바일: 단순히 children만 렌더 (분할 없음)
   - CSS: lg:flex lg:h-screen lg:overflow-hidden

2. src/components/layout/pane-list.tsx 생성:
   - props: { children: ReactNode; width?: 'default' | 'band-list' }
   - 데스크톱(lg:): w-[var(--list-pane-w)] 또는 w-[var(--band-list-pane-w)], border-r, overflow-y-auto, flex-shrink-0
   - 모바일: hidden (lg:block)
   - CSS: lg:w-[340px] lg:border-r lg:border-border lg:overflow-y-auto lg:flex-shrink-0
   - band-list variant: lg:w-[360px]

3. src/components/layout/pane-detail.tsx 생성:
   - props: { children: ReactNode }
   - 데스크톱(lg:): flex-1 overflow-y-auto bg-bg
   - 모바일: 기존 전체 화면 유지
   - CSS: lg:flex-1 lg:overflow-y-auto

4. src/components/layout/index.ts에서 모든 컴포넌트 re-export

### 7.2. bands 라우트 layout.tsx 생성 및 반응형 분기 처리

**Status:** pending  
**Dependencies:** 7.1  

src/app/(main)/bands/layout.tsx를 생성하여 데스크톱에서는 PaneSplit으로 마스터-디테일 구조를, 모바일에서는 기존 선형 구조를 유지하도록 구현한다.

**Details:**

1. src/app/(main)/bands/layout.tsx 신규 생성:
   - import { PaneSplit } from '@/components/layout/pane-split'
   - children과 함께 slot 패턴 사용 (parallel routes 또는 조건부 렌더링)
   
2. 레이아웃 구조:
   - 데스크톱(lg:): PaneSplit으로 감싸고 좌측에 BandListPane, 우측에 children(상세) 렌더
   - 모바일: children만 렌더 (목록/상세 각각 독립 페이지)
   
3. 반응형 처리 방식:
   - 'use client' 디렉티브로 클라이언트 컴포넌트화
   - useMediaQuery 훅 또는 CSS 기반 lg:hidden/lg:block 처리
   - CSS-only 접근 권장: lg:flex로 패널 표시, lg 미만에서 hidden

4. URL 호환성:
   - /bands 접근 시: 좌측 목록 + 우측 빈 상태(EmptyPane)
   - /bands/[bandId] 접근 시: 좌측 목록 + 우측 해당 밴드 상세
   - usePathname()으로 현재 상세 페이지 여부 판별

### 7.3. BandListPane 컴포넌트 구현 (검색 + 필터 + 목록)

**Status:** pending  
**Dependencies:** 7.1  

마스터 패널에 표시될 BandListPane 컴포넌트를 구현한다. 기존 BandsList.client.tsx의 목록 로직을 재사용하면서 검색창, 역할 필터 칩, 선택 상태 하이라이트를 추가한다.

**Details:**

1. src/app/(main)/bands/BandListPane.client.tsx 생성:
   - 기존 BandsList.client.tsx 로직 기반 (useBandList 훅 재사용)
   - 상단: 제목('밴드 탐색') + 밴드 만들기 버튼
   - 검색창: Input 컴포넌트 + search 아이콘, 밴드명/설명 필터링
   - 필터 칩: 전체/내 밴드 토글 (선택적)

2. BandCard 수정:
   - selectedBandId prop 추가하여 선택 상태 스타일링
   - 선택 시: bg-accent-dim border-accent/40 적용
   - BandRoleBadge 표시 (myRole이 있는 경우)

3. 선택 상태 관리:
   - useParams()로 현재 선택된 bandId 추출
   - 카드 클릭 시 router.push(ROUTES.BAND_DETAIL(bandId)) 호출
   - 데스크톱에서는 목록 유지 + 상세 갱신 (layout이 처리)

4. 스크롤 영역:
   - PaneList 내부에서 overflow-y-auto 적용
   - 무한 스크롤 loadMoreRef 유지

5. 디자인 토큰 적용:
   - 패딩: 20px 상단, 12px 하단
   - 카드 간격: space-y-1 (4px)

### 7.4. BandDetailPane 탭 구조 재구성 (정보/멤버/신청 현황)

**Status:** pending  
**Dependencies:** 7.1, 7.2  

기존 BandDetailContent를 PaneDetail 내부에서 동작하도록 수정하고, 데스크톱용 Topbar + 탭 레이아웃으로 재구성한다. 디자인 와이어프레임의 탭 구조(정보/멤버/신청 현황)를 적용한다.

**Details:**

1. src/app/(main)/bands/[bandId]/page.tsx 수정:
   - 데스크톱: PaneDetail 내부에 BandDetailPane 렌더
   - 모바일: 기존 BandDetailContent 유지 (풀스크린)

2. BandDetailPane 또는 BandDetailContent 수정:
   - 상단 Topbar 영역: breadcrumb('밴드 탐색') + 밴드명 + 액션 버튼들
     - LEADER/ADMIN: 밴드 설정 버튼
     - 비멤버: 가입 신청 버튼
     - 멤버(LEADER 제외): 밴드 탈퇴 버튼
   
3. 탭 구조 (Tabs 컴포넌트 사용):
   - 정보(info): 커버 이미지 영역 + 밴드명 + 설명
   - 멤버(members): 2열 그리드 멤버 목록 + BandRoleBadge
   - 신청 현황(applications): RoleGuard(ADMIN 이상) + 상태 필터 칩(대기/승인/거절) + 신청 목록

4. 탭 스타일링:
   - 디자인 와이어프레임 참고: 하단 보더 방식 active 표시
   - padding: 0 28px (px-7)
   - 콘텐츠 영역: padding 24px 28px (p-6 px-7)

5. 역할 기반 렌더링:
   - hasRole(myRole, 'ADMIN') 체크로 신청 현황 탭 조건부 표시
   - RoleGuard로 신청 목록 감싸기

### 7.5. EmptyPane 컴포넌트 및 URL 직접 접근 처리

**Status:** pending  
**Dependencies:** 7.2, 7.3, 7.4  

/bands 단독 접근 시 우측에 표시될 EmptyPane 컴포넌트를 구현하고, /bands/[bandId] 직접 URL 접근 시 좌측 목록과 우측 상세가 동시에 정상 렌더링되도록 보장한다.

**Details:**

1. src/components/layout/empty-pane.tsx 생성:
   - props: { icon?: LucideIcon; title: string; description?: string }
   - 중앙 정렬 레이아웃 (flex flex-col items-center justify-center h-full)
   - 아이콘 + 제목 + 설명 표시
   - 기본 메시지: '밴드를 선택하세요', '왼쪽 목록에서 밴드를 선택하면 상세 정보를 볼 수 있습니다.'

2. bands/layout.tsx 수정:
   - usePathname()으로 /bands 정확히 매칭 시 EmptyPane 표시
   - /bands/[bandId] 경로면 children(상세 페이지) 표시
   
3. URL 직접 접근 시나리오 처리:
   - /bands/b1 직접 접근: 좌측 BandListPane에서 b1 자동 선택 + 우측 상세
   - useParams()의 bandId로 선택 상태 동기화
   - SSR 시점에도 정상 렌더링 보장

4. 모바일 URL 접근:
   - /bands: 목록 페이지만 표시 (기존 동작)
   - /bands/[bandId]: 상세 페이지만 표시 (기존 동작)
   - 뒤로가기로 목록 복귀

5. 에러 경계 처리:
   - 존재하지 않는 bandId 접근 시 ErrorState 표시
   - useBandDetail의 isError 상태 활용
