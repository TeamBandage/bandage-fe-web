# Task ID: 1

**Title:** 신규 me 엔드포인트 API/타입 통합

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 백엔드가 신규 제공한 `/bands/me`, `/practices/me`, `/performances/me`, `/bands/search`, `/practices/me/search`, `/performances/search` 엔드포인트를 도메인 API 함수 및 타입으로 통합한다.

**Details:**

**구현 대상 파일:**

1. `src/domain/band/types/res.ts`:
   - `MyBandInfoResponse` 타입 추가 (BandInfoResponse 확장 + `myRole: BandRole`)
   ```ts
   export interface MyBandInfoResponse extends BandInfoResponse {
     myRole: BandRole;
   }
   ```

2. `src/domain/band/api/getMyBands.ts` (신규):
   - `GET /api/v1/bands/me` 호출
   - 파라미터: `{ lastId?: string; pageSize: number }`
   - 반환: `CursorResponse<MyBandInfoResponse, string>`

3. `src/domain/band/api/searchBands.ts` (신규):
   - `GET /api/v1/bands/search?keyword=...`
   - 파라미터: `{ keyword: string; lastId?: string; pageSize: number }`

4. `src/domain/practice/api/getMyPractices.ts` (신규):
   - `GET /api/v1/practices/me`
   - 커서 페이징 지원

5. `src/domain/practice/api/searchMyPractices.ts` (신규):
   - `GET /api/v1/practices/me/search?keyword=...`

6. `src/domain/performance/api/getMyPerformances.ts` (신규):
   - `GET /api/v1/performances/me`

7. `src/domain/performance/api/searchPerformances.ts` (신규):
   - `GET /api/v1/performances/search?keyword=...`

8. `src/global/config/queryKeys.ts` 업데이트:
   - `band.my()`, `practice.my()`, `performance.my()` 네임스페이스 분리
   - `band.search(keyword)`, `practice.mySearch(keyword)`, `performance.search(keyword)` 추가

**Test Strategy:**

1. 각 API 함수에 대해 유닛 테스트 작성 (vitest mock fetch)
2. TypeScript strict 모드 통과 확인 (`pnpm typecheck`)
3. ESLint 통과 확인 (`pnpm lint`)
4. 실서버 curl 테스트로 200 OK 응답 및 페이로드 구조 검증

## Subtasks

### 1.1. MyBandInfoResponse 타입 정의 및 res.ts 확장

**Status:** pending  
**Dependencies:** None  

src/domain/band/types/res.ts 에 MyBandInfoResponse 인터페이스를 추가하여 BandInfoResponse를 확장하고 myRole 필드를 포함시킨다.

**Details:**

BandInfoResponse를 extends 하여 MyBandInfoResponse 인터페이스를 정의한다. myRole 필드는 BandRole 타입(LEADER | ADMIN | MEMBER)을 사용한다. 기존 res.ts 파일의 import 문에서 BandRole이 이미 @/global/types에서 import되어 있으므로 추가 import 불필요. 인터페이스 정의: `export interface MyBandInfoResponse extends BandInfoResponse { myRole: BandRole; }`. 이 타입은 GET /api/v1/bands/me 응답의 content 배열 항목 타입으로 사용된다.

### 1.2. Band 도메인 신규 API 함수 구현 (getMyBands, searchBands)

**Status:** pending  
**Dependencies:** 1.1  

src/domain/band/api/ 디렉토리에 getMyBands.ts와 searchBands.ts 파일을 생성하여 /bands/me 및 /bands/search 엔드포인트 호출 함수를 구현한다.

**Details:**

getMyBands.ts: GET /api/v1/bands/me 호출. 파라미터 타입 { lastId?: string; pageSize: number }. 반환 타입 CursorResponse<MyBandInfoResponse, string>. apiClient.get 사용, query에 lastId와 pageSize 전달. 기존 getBands.ts 패턴 참조하여 null 응답 시 빈 CursorResponse 반환 처리. searchBands.ts: GET /api/v1/bands/search 호출. 파라미터 타입 { keyword: string; lastId?: string; pageSize: number }. keyword는 필수. 반환 타입 CursorResponse<BandInfoResponse, string>. 검색 결과는 myRole 없이 일반 BandInfoResponse 반환.

### 1.3. Practice 도메인 신규 API 함수 구현 (getMyPractices, searchMyPractices)

**Status:** pending  
**Dependencies:** None  

src/domain/practice/api/ 디렉토리에 getMyPractices.ts와 searchMyPractices.ts 파일을 생성하여 /practices/me 및 /practices/me/search 엔드포인트 호출 함수를 구현한다.

**Details:**

getMyPractices.ts: GET /api/v1/practices/me 호출. 파라미터 타입 { lastId?: string; pageSize: number }. 반환 타입 CursorResponse<PracticeListItemResponse, string>. 기존 getPractices.ts 패턴 참조. searchMyPractices.ts: GET /api/v1/practices/me/search 호출. 파라미터 타입 { keyword: string; lastId?: string; pageSize: number }. keyword 필수(합주 타이틀 또는 곡 제목 검색). 반환 타입 CursorResponse<PracticeListItemResponse, string>. 두 함수 모두 apiClient.get 사용, null 응답 시 빈 CursorResponse 반환.

### 1.4. Performance 도메인 신규 API 함수 구현 (getMyPerformances, searchPerformances)

**Status:** pending  
**Dependencies:** None  

src/domain/performance/api/ 디렉토리에 getMyPerformances.ts와 searchPerformances.ts 파일을 생성하여 /performances/me 및 /performances/search 엔드포인트 호출 함수를 구현한다.

**Details:**

getMyPerformances.ts: GET /api/v1/performances/me 호출. 파라미터 타입 { lastId?: string; pageSize: number }. 반환 타입 CursorResponse<PerformanceListItemResponse, string>. 기존 getPerformances.ts 패턴 참조. searchPerformances.ts: GET /api/v1/performances/search 호출. 파라미터 타입 { keyword: string; lastId?: string; pageSize: number }. keyword 필수(공연 제목 검색). 반환 타입 CursorResponse<PerformanceListItemResponse, string>. 두 함수 모두 apiClient.get 사용, null 응답 시 빈 CursorResponse 반환.

### 1.5. queryKeys.ts 업데이트 - 신규 엔드포인트용 쿼리 키 네임스페이스 추가

**Status:** pending  
**Dependencies:** 1.2, 1.3, 1.4  

src/global/config/queryKeys.ts 파일을 수정하여 band.my(), band.search(keyword), practice.my(), practice.mySearch(keyword), performance.my(), performance.search(keyword) 쿼리 키 함수를 추가한다.

**Details:**

기존 queryKeys 객체 확장: band 네임스페이스에 search: (keyword: string) => [...queryKeys.band.all, 'search', keyword] as const 추가. practice 네임스페이스에 my: () => [...queryKeys.practice.all, 'my'] as const, mySearch: (keyword: string) => [...queryKeys.practice.all, 'my', 'search', keyword] as const 추가. performance 네임스페이스에 my: () => [...queryKeys.performance.all, 'my'] as const, search: (keyword: string) => [...queryKeys.performance.all, 'search', keyword] as const 추가. 기존 band.my()는 이미 정의되어 있으므로 유지. TanStack Query 캐시 키 충돌 방지를 위해 네임스페이스 계층 구조 일관성 유지.
