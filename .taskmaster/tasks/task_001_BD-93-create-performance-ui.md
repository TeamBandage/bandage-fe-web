# Task ID: 1

**Title:** 공연 생성 페이지 UI 개선 및 셋리스트 API 연동

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 합주 생성 페이지(JamCreateWizard) UI 스타일을 참고하여 공연 생성 페이지(PerformanceCreateWizard) UI를 개선한다. 주황색 버튼 등 기존 강조색을 흰색 포인트로 교체하고, GET /api/v1/setlists/me API를 연동하여 셋리스트 목록을 실제 데이터로 보여준다. setlistMeetingIds 대신 setlistIds를 사용하도록 CreatePerformanceRequest도 수정한다.

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 1.1. PerformanceCreateWizard UI 스타일을 JamCreateWizard 흰색 테마로 개선

**Status:** done  
**Dependencies:** None  

공연 생성 마법사의 스타일링을 합주 생성 마법사의 흰색 포인트 UI로 통일합니다.

**Details:**

PerformanceCreateWizard.client.tsx에서 다음 작업 수행:
- StepIndicator에 colorScheme="white" prop 추가
- inputCls 상수 정의 및 Input 컴포넌트에 rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0 클래스 적용
- Button 컴포넌트의 '다음', '공연 만들기' 버튼을 bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30 rounded-[5px] 스타일로 변경
- footer의 이전 버튼 스타일에 rounded-[5px] 추가
- 시작 시각 및 소요 시간 입력 영역을 JamCreateWizard처럼 bg-surface border border-white/20 rounded-[5px] 카드 스타일로 개선

### 1.2. Setlist 도메인 API 함수 및 타입 정의 추가

**Status:** done  
**Dependencies:** None  

GET /api/v1/setlists/me API 호출을 위한 fetcher 함수와 SetlistResponse 타입을 정의합니다.

**Details:**

src/domain/setlist/ 디렉토리 구조 생성:
- types/res.ts: BE schema.d.ts의 SetlistResponse 타입 정의 (setlistId, title, managerId, trackSelectionId, createdAt, updatedAt)
- types/index.ts: 타입 re-export
- api/getMySetlists.ts: apiClient.get<CursorResponse<SetlistResponse, string>>('/api/v1/setlists/me', { query: { lastId, pageSize } }) fetcher 함수 구현
- api/index.ts: API 함수 re-export
- hooks/useMySetlists.ts: TanStack Query useInfiniteQuery 래퍼 훅 구현 (queryKey: ['setlists', 'me'])

### 1.3. SetlistPickerModal을 실제 API 데이터로 전환

**Status:** done  
**Dependencies:** 1.2  

SetlistPickerModal 컴포넌트가 mock store 대신 GET /api/v1/setlists/me API를 호출하도록 수정합니다.

**Details:**

SetlistPickerModal.client.tsx 수정:
- useSetlistStore 대신 useMySetlists 훅 사용
- Meeting 타입 대신 SetlistResponse 타입 기반으로 selection 상태 관리
- filtered 로직: SetlistResponse의 title 필드로 검색
- songCount/confirmedCount 관련 로직 제거 또는 간소화 (BE SetlistResponse에 해당 정보 없음)
- 리스트 아이템 UI를 SetlistResponse 필드(title, createdAt, updatedAt)로 렌더링
- 무한 스크롤 지원: useMySetlists의 fetchNextPage 연동
- Props 변경: Meeting[] → SetlistResponse[]로 onConfirm, initialSelection 타입 수정

### 1.4. CreatePerformanceRequest 타입 수정 (setlistMeetingIds → setlistIds)

**Status:** done  
**Dependencies:** None  

FE의 CreatePerformanceRequest 타입을 BE 스펙과 일치하도록 setlistIds 필드로 수정합니다.

**Details:**

src/domain/performance/types/req.ts 수정:
- setlistMeetingIds?: string[] 필드를 setlistIds?: string[]로 변경
- bandIds 필드 제거 (BE 스펙에 없음)

관련 파일 연쇄 수정:
- useCreatePerformance.ts: mutation 호출 시 타입 확인
- createPerformance.ts: 변경된 타입 사용 확인

### 1.5. PerformanceCreateWizard에서 setlistIds로 API 연동 완성

**Status:** done  
**Dependencies:** 1.1, 1.3, 1.4  

PerformanceCreateWizard가 SetlistResponse 기반으로 셋리스트를 선택하고 setlistIds로 공연 생성 API를 호출하도록 통합합니다.

**Details:**

PerformanceCreateWizard.client.tsx 최종 통합:
- import 변경: Meeting → SetlistResponse (domain/setlist/types)
- selectedMeetings 상태 타입을 SetlistResponse[]로 변경
- SetlistPickerModal의 onConfirm 콜백에서 SetlistResponse[] 수신
- submit 함수에서 mutation.mutate 호출 시 setlistIds: selectedMeetings.map(s => s.setlistId) 사용
- Step 2 셋리스트 표시: SetlistResponse의 title 필드 사용
- Step 3 검토 섹션의 셋리스트 요약: selectedMeetings.map(s => s.title).join(', ')
- 불필요한 Meeting 타입 import 제거
