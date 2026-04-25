# Task ID: 19

**Title:** 리스트 페이지에 '내 소속' / '검색(전체)' 탭 분리

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 각 도메인 리스트 패널을 '내 소속' (현재 useMyBands 류) 과 '검색/전체' (Task 18 의 useDiscoverySearch + 전체 목록) 탭으로 분리해, 자기 밴드만 보던 화면에서 다른 밴드도 탐색 가능하게 한다.

**Details:**

1) BandsListPane / PracticesListPane / PerformancesListPane 헤더 아래 Tabs 컴포넌트 추가, 2개 탭: '내 밴드/합주/공연' | '탐색'. 2) '내' 탭: 기존 hook (useMyBands / 본인 참여 합주 / 본인 참여 공연 — 현 단계에선 useBandList 등의 결과를 그대로 사용해도 OK; 백엔드가 my-only 필터를 도입하면 그때 hook 갈아끼움). 3) '탐색' 탭: 검색 input + 전체 목록 + Task 18 의 필터링. 4) 탭 상태는 컴포넌트 로컬 state, URL 쿼리에 ?tab=mine|discover 동기화 (replaceState 로 가벼운 sync). 5) 모바일은 동일 Tabs 가 PaneList 위치에서 동작. 6) 기본 탭은 '내'. 7) Playwright: /bands 진입 시 기본 '내' 탭, [탐색] 클릭 시 검색 input 노출 확인.

**Test Strategy:**

No test strategy provided.
