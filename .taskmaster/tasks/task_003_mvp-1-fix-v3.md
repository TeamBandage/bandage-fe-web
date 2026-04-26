# Task ID: 3

**Title:** 내 리소스 vs 탐색 화면 정합성 정리

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** 밴드/합주/공연 목록 화면과 홈 통계 카드에서 `useMyBands`/`useMyPractices`/`useMyPerformances` 훅을 사용하도록 교체하고, 밴드 상세의 가입 신청 버튼 노출 조건을 수정한다.

**Details:**

**수정 대상:**

1. `src/app/(main)/bands/BandsListPane.client.tsx`:
   - 내 밴드 탭: `useMyBands` 결과 사용
   - 카드에 `myRole` 표시 (`RoleBadge` 활용)
   - 탐색 탭: `useBandList` 유지, 내가 이미 소속된 밴드는 "이미 가입됨" 디스에이블 처리

2. `src/app/(main)/practices/PracticesListPane.client.tsx`:
   - `useMyPractices` 로 교체 (나의 합주)

3. `src/app/(main)/performances/PerformancesListPane.client.tsx`:
   - `useMyPerformances` 로 교체

4. `src/app/(main)/home/HomeStatCards.client.tsx`:
   - `useMyBands().data?.length` 그대로 유지 (이미 사용 중)
   - `useUpcomingPractices`/`useUpcomingPerformances` 를 me 엔드포인트 기반으로 조정 필요시

5. `src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx`:
   - 가입 신청 버튼 노출 조건 수정:
     ```ts
     const { data: myBands } = useMyBands(100);
     const isMember = myBands?.some(b => b.bandId === bandId) ?? false;
     // isMember === false 일 때만 가입 신청 버튼 노출
     ```
   - 기존 `useBandRole` 은 Task 2 에서 단순화되어 동일 결과

6. 카드 컴포넌트에 `RoleBadge` 추가:
   - `BandCard` 또는 리스트 아이템에 myRole 표시

**Test Strategy:**

1. 개발 서버에서 밴드/합주/공연 리스트 렌더링 확인
2. 내 밴드에 myRole 칩이 표시되는지 시각 확인
3. 밴드 상세 진입 시 멤버 여부에 따른 가입 신청 버튼 표시/비표시 확인
4. 홈 통계 카드 숫자가 정상 반영되는지 확인
5. `pnpm typecheck && pnpm lint` 통과

## Subtasks

### 3.1. BandsListPane 내 밴드 탭에 useMyBands 훅 적용 및 RoleBadge 표시

**Status:** pending  
**Dependencies:** None  

BandsListPane.client.tsx의 '내 밴드' 탭에서 Task 2에서 구현된 useMyBands 훅을 사용하고, MyBandInfoResponse의 myRole 필드를 활용하여 RoleBadge 컴포넌트로 역할을 표시한다.

**Details:**

1. BandRow 컴포넌트를 MyBandRow로 분리하여 MyBandInfoResponse 타입을 받도록 수정
2. MyBandRow에서 RoleBadge 컴포넌트를 import하고 myRole 필드로 역할 배지 렌더링
3. 배지 위치: 밴드명 오른쪽 또는 설명 하단에 인라인 배치
4. 탐색 탭에서 내가 이미 소속된 밴드는 'isMember' 플래그로 체크하여 '이미 가입됨' 텍스트와 함께 disabled 스타일 적용
5. myBands 데이터에서 bandId Set을 만들어 탐색 탭의 밴드와 비교

### 3.2. PracticesListPane 내 합주 탭에 useMyPractices 훅 적용

**Status:** pending  
**Dependencies:** 3.1  

PracticesListPane.client.tsx의 '내 합주' 탭에서 기존 usePractices 훅 대신 Task 2에서 구현된 useMyPractices 훅을 사용하도록 교체한다.

**Details:**

1. useMyPractices 훅을 import (src/domain/practice/hooks/useMyPractices.ts)
2. '내 합주' 탭의 데이터 소스를 useMyPractices로 교체
3. '탐색' 탭은 기존 usePractices 유지하여 전체 합주 목록 표시
4. 타입 호환성 확인: PracticeListItemResponse가 두 훅 모두에서 동일하게 사용되는지 검증
5. 로딩/에러/빈 상태 처리 로직 유지

### 3.3. PerformancesListPane 내 공연 탭에 useMyPerformances 훅 적용

**Status:** pending  
**Dependencies:** 3.1  

PerformancesListPane.client.tsx의 '내 공연' 탭에서 기존 usePerformanceList 훅 대신 Task 2에서 구현된 useMyPerformances 훅을 사용하도록 교체한다.

**Details:**

1. useMyPerformances 훅을 import (src/domain/performance/hooks/useMyPerformances.ts)
2. '내 공연' 탭의 데이터 소스를 useMyPerformances로 교체
3. '탐색' 탭은 기존 usePerformanceList 유지하여 전체 공연 목록 표시
4. 타입 호환성 확인: PerformanceListItemResponse가 두 훅 모두에서 동일하게 사용되는지 검증
5. 로딩/에러/빈 상태 처리 로직 유지

### 3.4. BandDetailContent 가입 신청 버튼 노출 조건을 useMyBands 기반으로 수정

**Status:** pending  
**Dependencies:** 3.1  

BandDetailContent.client.tsx에서 가입 신청 버튼의 노출 조건을 useMyBands 훅 결과를 기반으로 수정하여, 이미 소속된 밴드에서는 가입 신청 버튼이 표시되지 않도록 한다.

**Details:**

1. useMyBands(100) 호출하여 내 밴드 목록 조회
2. isMember 계산: myBands?.some(b => b.bandId === bandId) ?? false
3. 기존 useBandRole 결과와 조합하여 isMember 판단 (Task 2에서 useBandRole이 useMyBands 기반으로 단순화되므로 중복 호출 방지)
4. isMember === false 일 때만 가입 신청 버튼 노출
5. 리더/멤버 분기 로직은 기존 myRole 기반 유지

### 3.5. HomeStatCards의 useUpcomingPractices/useUpcomingPerformances me 엔드포인트 정합성 확인

**Status:** pending  
**Dependencies:** 3.2, 3.3  

HomeStatCards.client.tsx에서 사용 중인 useUpcomingPractices와 useUpcomingPerformances 훅이 me 엔드포인트 기반으로 정상 동작하는지 확인하고, 필요시 조정한다.

**Details:**

1. 현재 useMyBands는 이미 HomeStatCards에서 사용 중 - 유지
2. useUpcomingPractices와 useUpcomingPerformances가 me 엔드포인트를 사용하도록 Task 2에서 수정되었는지 확인
3. 수정되지 않은 경우, 내 합주/공연만 카운트하도록 훅 호출 조정 또는 Task 2 완료 후 자동 반영 확인
4. 홈 화면 진입 시 통계 카드 숫자가 내 리소스 기준으로 정확히 표시되는지 검증
5. 타입 정합성 확인: length 속성 접근이 정상 동작하는지
