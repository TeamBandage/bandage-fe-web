# Task ID: 18

**Title:** 밴드/합주/공연 디스커버리 검색 기능 (비소속 포함)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 프로토타입 '밴드 탐색' 처럼 내가 소속되지 않은 밴드/합주/공연도 이름·설명·곡으로 검색할 수 있게 한다. 백엔드 검색 query 파라미터가 없으므로 1차로 클라이언트 사이드 필터링을 적용하고, 향후 서버 사이드로 전환 가능한 추상(useDiscoverySearch 훅) 을 둔다.

**Details:**

1) BandsListPane / PracticesListPane / PerformancesListPane 상단 검색 input 추가 (lucide Search 아이콘 + Input). 2) src/hooks/useDiscoverySearch.ts: 입력 텍스트 normalize(소문자/공백) + 다중 필드 OR 매칭. 3) Band 검색: bandName + description, Practice 검색: title + venue + song.title (가능 시), Performance 검색: title + venue. 4) 입력값이 있으면 useBandList/usePractices/usePerformanceList 의 페이지를 모두 펼쳐 클라이언트 필터링; 비어있으면 정상 무한 스크롤. 5) 검색 결과 0건일 때 EmptyPane('검색 결과가 없습니다'). 6) 백엔드에 'q' 쿼리 파라미터가 추가되면 hook 내부만 교체할 수 있도록 단일 진입점 유지. 7) Playwright: /bands 에서 검색어 입력 시 결과 카운트가 변하는지 스모크.

**Test Strategy:**

No test strategy provided.
