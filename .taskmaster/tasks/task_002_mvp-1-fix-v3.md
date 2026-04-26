# Task ID: 2

**Title:** me 엔드포인트 TanStack Query 훅 구현

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Task 1에서 구현한 API 함수들을 래핑하는 TanStack Query 훅을 구현하고, 기존 `useMyBands`, `useBandRole` 훅을 신규 엔드포인트 활용으로 리팩토링한다.

**Details:**

**훅 구현:**

1. `src/domain/band/hooks/useMyBands.ts` 수정:
   - 기존 `getBands` 우회 호출 → `getMyBands` 직접 호출로 교체
   - 반환 타입: `MyBandInfoResponse[]` (myRole 포함)
   - 기존 limit 인터페이스 유지 (하위 호환)
   ```ts
   export function useMyBands(limit: number = 10) {
     return useQuery<MyBandInfoResponse[], Error>({
       queryKey: [...queryKeys.band.my(), limit],
       queryFn: async () => {
         const page = await getMyBands({ pageSize: limit });
         return page.content;
       },
     });
   }
   ```

2. `src/domain/band/hooks/useBandSearch.ts` (신규):
   - `useInfiniteCursor` 래핑
   - keyword 디바운스는 호출측에서 처리

3. `src/domain/practice/hooks/useMyPractices.ts` (신규):
   - `useInfiniteCursor<PracticeListItemResponse, string>` 활용

4. `src/domain/practice/hooks/useBandPractices.ts` (신규):
   - `GET /api/v1/practices?bandId=` 래핑 (탐색용)

5. `src/domain/performance/hooks/useMyPerformances.ts` (신규)

6. `src/global/auth/useBandRole.ts` 단순화:
   - 기존: `getBandMembers` 페이지네이션으로 100건씩 순회하며 memberId 매칭
   - 신규: `useMyBands` 결과에서 해당 bandId 의 myRole 반환
   ```ts
   export function useBandRole(bandId: string) {
     const { data: myBands } = useMyBands(100);
     const match = myBands?.find(b => b.bandId === bandId);
     return { data: match?.myRole ?? null, ... };
   }
   ```

**Test Strategy:**

1. `useBandRole` 반환값이 기존과 동일한지 통합 테스트
2. `RoleGuard`, `BandDetailContent` 등 호출부에서 동작 회귀 없는지 확인
3. React Query DevTools 로 캐시 키 충돌 없음 검증
4. `pnpm typecheck && pnpm lint` 통과

## Subtasks

### 2.1. useMyBands 훅 리팩토링 - getMyBands API 직접 호출로 교체

**Status:** pending  
**Dependencies:** None  

기존 getBands 우회 호출 방식을 Task 1에서 구현한 getMyBands API 직접 호출로 교체하고, 반환 타입을 MyBandInfoResponse[]로 변경한다.

**Details:**

src/domain/band/hooks/useMyBands.ts 수정:
- import 경로를 getBands에서 getMyBands로 변경
- 반환 타입을 BandInfoResponse[]에서 MyBandInfoResponse[]로 변경 (myRole 포함)
- queryFn 내부에서 getMyBands({ pageSize: limit }) 호출
- queryKey는 기존 queryKeys.band.my() 유지하여 캐시 키 호환성 보장
- 기존 limit 인터페이스 그대로 유지하여 호출측(HomeStatCards, BandsListPane 등) 하위 호환성 확보
- 파일 상단 NOTE 주석 제거 (더 이상 우회 호출이 아니므로)

### 2.2. useBandSearch 훅 신규 구현 - 밴드 검색 무한 스크롤

**Status:** pending  
**Dependencies:** 2.1  

searchBands API를 래핑하는 useInfiniteCursor 기반 훅을 구현하고, keyword 파라미터를 받아 밴드 검색 결과를 무한 스크롤로 제공한다.

**Details:**

src/domain/band/hooks/useBandSearch.ts 신규 생성:
- 'use client' 지시어 추가
- useInfiniteCursor<BandInfoResponse, string> 활용
- 함수 시그니처: useBandSearch(keyword: string, pageSize: number = 20)
- queryKey: queryKeys.band.search(keyword)와 pageSize 조합
- keyword가 빈 문자열일 때 enabled: false로 불필요한 요청 방지
- keyword 디바운스는 호출측(탐색 화면)에서 useDebounce 훅으로 처리하므로 훅 내부에서는 처리하지 않음
- types/index.ts에서 export 추가 불필요 (훅이므로)

### 2.3. useMyPractices, useBandPractices 훅 신규 구현

**Status:** pending  
**Dependencies:** 2.1  

합주 도메인에 getMyPractices API를 래핑하는 useMyPractices 훅과 특정 밴드의 합주 목록 조회용 useBandPractices 훅을 구현한다.

**Details:**

1. src/domain/practice/hooks/useMyPractices.ts 신규 생성:
- useInfiniteCursor<PracticeListItemResponse, string> 활용
- queryKey: queryKeys.practice.my()와 pageSize 조합
- getMyPractices API 호출

2. src/domain/practice/hooks/useBandPractices.ts 신규 생성:
- 기존 usePractices.ts와 유사하나 bandId 필수 파라미터로 변경
- queryKey: queryKeys.practice.list(bandId)와 pageSize 조합
- getPractices({ bandId, lastId, pageSize }) API 호출
- 밴드 상세 화면의 합주 탭에서 사용할 목적

기존 usePractices.ts는 bandId가 optional이어서 전체/밴드별 겸용이었으나, 역할 분리를 위해 useBandPractices 추가

### 2.4. useMyPerformances 훅 신규 구현

**Status:** pending  
**Dependencies:** 2.1  

공연 도메인에 getMyPerformances API를 래핑하는 useMyPerformances 훅을 구현하여 로그인 사용자의 공연 목록을 무한 스크롤로 제공한다.

**Details:**

src/domain/performance/hooks/useMyPerformances.ts 신규 생성:
- 'use client' 지시어 추가
- useInfiniteCursor<PerformanceListItemResponse, string> 활용
- 함수 시그니처: useMyPerformances(pageSize: number = 20)
- queryKey: queryKeys.performance.my()와 pageSize 조합
- Task 1에서 구현한 getMyPerformances API 호출
- 기존 usePerformanceList(bandId?)와 역할 분리: useMyPerformances는 내 공연 전용, usePerformanceList는 밴드별/전체 탐색용
- queryKeys.ts에 performance.my() 추가는 Task 1에서 완료되어 있어야 함

### 2.5. useBandRole 훅 단순화 - useMyBands 기반 역할 조회로 리팩토링

**Status:** pending  
**Dependencies:** 2.1  

기존 getBandMembers 페이지네이션 순회 방식을 useMyBands 결과의 myRole 필드 활용 방식으로 단순화하여 API 호출 횟수와 복잡도를 줄인다.

**Details:**

src/global/auth/useBandRole.ts 리팩토링:
- 기존 구현: useMe로 memberId 확보 후 getBandMembers 최대 100건씩 10페이지 순회하며 매칭 (최악 1000건 조회)
- 신규 구현: useMyBands(100) 결과에서 bandId 매칭하여 myRole 반환
- 핵심 변경:
  1. getBandMembers import 제거
  2. useMe 의존성 제거 (useMyBands가 인증 사용자 기준으로 동작)
  3. const { data: myBands } = useMyBands(100);
  4. const match = myBands?.find(b => b.bandId === bandId);
  5. return { data: match?.myRole ?? null, isLoading, ... };
- queryKey 변경: 기존 [...queryKeys.band.members(bandId), 'my-role', memberId] → 불필요 (useMyBands 내부 키 사용)
- 비멤버인 경우 myBands에 해당 bandId가 없으므로 null 반환 (기존 동작과 동일)
- RoleGuard, BandDetailContent 등 기존 호출부에서 인터페이스 변경 없이 동작
