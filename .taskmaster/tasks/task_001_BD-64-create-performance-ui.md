# Task ID: 1

**Title:** 공연 생성 위저드 Step2 셋리스트 피커 교체

**Status:** in-progress

**Dependencies:** None

**Priority:** high

**Description:** PerformanceCreateWizard의 Step2 '참여 밴드'를 '셋리스트' 단계로 교체. SetlistPickerModal 신규 구현, CreatePerformanceRequest에 setlistMeetingIds 필드 추가, 위저드 submit 로직 업데이트.

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 1.1. CreatePerformanceRequest 타입 및 스키마에 setlistMeetingIds 필드 추가

**Status:** pending  
**Dependencies:** None  

CreatePerformanceRequest 타입에서 bandIds 필드를 setlistMeetingIds로 교체하고, createPerformanceSchema zod 스키마 업데이트

**Details:**

src/domain/performance/types/req.ts에서 CreatePerformanceRequest 인터페이스의 bandIds?: string[] 필드를 setlistMeetingIds?: string[]로 변경. src/domain/performance/types/schema.ts의 createPerformanceSchema에서 해당 필드 검증 로직 업데이트. 백엔드 API 스펙과 필드명 일치 확인 필요.

### 1.2. SetlistPickerModal 컴포넌트 신규 구현

**Status:** pending  
**Dependencies:** 1.1  

EntityPickerModal 패턴 기반으로 셋리스트 미팅 선택용 SetlistPickerModal.client.tsx 구현

**Details:**

src/domain/setlist-meeting/components/SetlistPickerModal.client.tsx 생성. BandPickerModal 패턴 참조하여 EntityPickerModal<SetlistMeetingResponse> 래핑. fetcher로 getMySetlistMeetings API 활용(keyword 검색 지원 여부 확인 후 필터링 로직 결정). multiple={true} 다중 선택 지원. renderItem에서 미팅 제목, 밴드명, purpose 표시. 선택 상태 UI는 Chip 형태로 표현.

### 1.3. PerformanceCreateWizard Step1을 셋리스트 피커로 교체

**Status:** pending  
**Dependencies:** 1.2  

위저드의 Step1 '참여 밴드' UI를 '셋리스트' 단계로 전환, BandPickerModal 대신 SetlistPickerModal 사용

**Details:**

PerformanceCreateWizard.client.tsx에서 selectedBands 상태를 selectedSetlistMeetings: SetlistMeetingResponse[]로 변경. Step1 라벨 '참여 밴드' → '셋리스트'로 수정. BandPickerModal import 제거, SetlistPickerModal로 교체. 선택된 셋리스트 Chip 렌더링 로직 업데이트(미팅 제목+밴드명 표시). Step1 → Step2 이동 시 별도 검증 없음(선택 optional 유지).

### 1.4. 위저드 submit 로직 및 Review 단계 업데이트

**Status:** pending  
**Dependencies:** 1.1, 1.3  

공연 생성 mutation 호출 시 setlistMeetingIds 전달, Step2 검토 화면에 셋리스트 요약 표시

**Details:**

handleSubmit 함수에서 mutationRequest 객체의 bandIds를 setlistMeetingIds로 변경(selectedSetlistMeetings에서 meetingId 추출). WizardSummaryCard에 셋리스트 필드 추가(label: '셋리스트', value: 선택된 미팅 제목 나열 또는 개수 표시, onEdit: setStep(1)). useCreatePerformance 훅이 새 필드 전달하도록 확인. 최종 API 호출 전 데이터 구조 로깅으로 검증.
