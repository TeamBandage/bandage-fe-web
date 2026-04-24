# Task ID: 12

**Title:** 디자인 요소 간 간격(spacing) 감사 및 보정

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Sidebar/페이지 제목/섹션 간 여백과 레이아웃 여백을 체계적으로 점검해 지나치게 붙거나 떨어진 부분을 토큰 기반으로 재조정한다.

**Details:**

1) Sidebar nav item 의 좌측 아이콘과 라벨, 우측 가장자리 여백 점검 — 현재 px-s-3(12)/gap-s-3(12) 을 px-s-4(16)/gap-s-4(16) 로 확대 검토. 2) 페이지 제목(PageTitle) 과 최상단 경계 여백: 모바일 py-s-6, 데스크톱 py-s-8 이상. 3) SectionTitle mb-s-3 을 각 섹션 헤더 높이와 조화시키고, 섹션 간 space-y-s-8 유지. 4) PaneDetail 내부 좌우 패딩이 lg:px-7 상태에서 컨텐츠가 breathing 하는지, Topbar 높이 68px 와의 조화 확인. 5) Shell 마운트 시 Sidebar right border 와 children 본문의 패딩 겹침/간섭 확인. 6) playground/layout 의 composition 을 보며 수정된 여백 전수 확인.

**Test Strategy:**

No test strategy provided.
