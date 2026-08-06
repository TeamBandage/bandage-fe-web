## 검증 일시
2026-08-06

## 대상 API 목록
- `GET /api/v1/track-selections/{selectionId}/items` (선곡 항목 목록 조회) — status/appliedByMe/memberName/keyword(+searchFields) 필터 4종 신규 연동

## 정상 응답 확인
- 실서버(`https://bandage.team`) 라이브 OpenAPI 스펙(`/api-docs`)을 직접 조회해 `TrackSelectionItemPagingQuery` 스키마를 확인. 로컬 vendored `openapi/openapi.json`에는 해당 쿼리 파라미터(status/appliedByMe/memberName/keyword/searchFields)가 아예 없어(스펙 drift), 라이브 스펙 기준으로 파라미터명·enum 값·직렬화 방식을 재확인함.
  - `status`: `OPEN | APPLY_COMPLETED | ASSIGN_COMPLETED | CLOSED` (배열, OR 결합)
  - `appliedByMe`: boolean
  - `memberName`: string (대소문자 무시 부분검색)
  - `keyword` + `searchFields`(`TITLE | ARTIST | ALBUM`, 미지정 시 3개 전체 OR)
  - 4개 필터는 서로 AND 결합
- `apiClient`가 배열 쿼리값을 지원하지 않던 것을 확인 후 반복 키 방식(`status=A&status=B`, Spring `List<T>` 기본 바인딩 규약)으로 직렬화하도록 확장.
- Playwright로 `MeetingDetail` 컴포넌트를 실제 렌더링하고 `page.route()`로 `GET .../items*` 요청을 가로채 아래 6개 시나리오의 **요청 쿼리스트링**을 캡처·확인(응답은 더미로 fulfill):
  | 시나리오 | 캡처된 쿼리스트링 |
  |---|---|
  | 전체 탭(초기 로드) | `?pageSize=50` (base 쿼리와 필터 쿼리가 동일 키로 dedupe되어 요청 1회만 발생) |
  | 합주 가능 탭 | `?pageSize=50&status=ASSIGN_COMPLETED` |
  | 모집 중 탭 | `?pageSize=50&status=OPEN&status=APPLY_COMPLETED` |
  | 내 지원 탭 | `?pageSize=50&appliedByMe=true` |
  | 곡 검색(디바운스 후) | `?pageSize=50&keyword=stairway` |
  | 멤버 검색 추가 입력 | `?pageSize=50&memberName=홍길동&keyword=stairway` (AND 결합 확인) |
- 후속으로 발견: 선곡 항목 목록이 `pageSize=50` 첫 페이지만 불러오고 무한 스크롤이 연결돼 있지 않던 기존 결함을 함께 수정. `useInfiniteScrollSentinel`(다른 목록 화면과 동일 패턴)을 연결해, 2페이지 응답(`lastId=<이전 페이지 마지막 id>`)이 정확한 커서로 요청되고 테이블에 병합 렌더링되는 것까지 Playwright로 확인.

## 에러 케이스 확인
- **미실시.** 실제 로그인 세션/인증 토큰이 없어 `https://bandage.team`에 대한 인증된 실제 호출(401/403/404/400/5xx 각 시나리오)은 수행하지 못함. 위 검증은 (1) 라이브 OpenAPI 스펙과의 파라미터 계약 일치, (2) FE가 실제로 내보내는 요청 쿼리스트링이 그 계약과 일치하는지를 네트워크 레벨에서 확인한 것으로 범위가 제한됨.

## 이슈 사항
- `status` 필터값끼리 겹칠 수 있다는 BE 문서 경고(예: `ASSIGN_COMPLETED` 항목은 `APPLY_COMPLETED` 조건도 만족)에 따라, "모집 중" 탭은 `status=[OPEN, APPLY_COMPLETED]` 서버 필터에 더해 클라이언트에서 `isReady`가 아닌 항목만 한 번 더 걸러내는 보정을 추가함(`MeetingDetail.client.tsx`). 사용자 확인 후 채택한 방식.
- 위 "에러 케이스 확인" 미실시 항목은 실제 로그인 세션에서 사용자가 직접 4xx/5xx 케이스(예: 존재하지 않는 selectionId로 404, 권한 없는 회의 접근 시 403 등)를 확인해 주시거나, 테스트 계정 정보를 공유해 주시면 후속으로 보완 가능.
