# Task ID: 1

**Title:** 마이페이지 주간 타임테이블 UI 구현 (BD-66)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 마이페이지 프로필 정보 하단에 주간 타임테이블 섹션을 추가한다. 본인의 합주·공연 일정이 컬러 블록으로 표시되고, 불가능 시간대는 회색으로 표시된다. [나의 스케줄 관리] 버튼으로 가능 시간대를 설정하는 2단계 모달을 제공한다. API: GET/PUT /api/v1/me/availability, GET /api/v1/practices/me, GET /api/v1/performances/me

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 1.1. Availability 관련 타입 정의 (domain/member/types)

**Status:** done  
**Dependencies:** None  

마이페이지 주간 타임테이블 기능에 필요한 MemberAvailability 관련 타입을 정의한다. API_SPEC 2-7, 2-8을 참조하여 백엔드 DTO와 1:1 대응하는 타입을 작성한다.

**Details:**

domain/member/types/req.ts에 MemberAvailabilityRequest 추가: weeklyRules (WeeklyRuleRequest[]), exceptions (AvailabilityExceptionRequest[]), note (string|null). WeeklyRuleRequest: dayOfWeek (DayOfWeek enum), startSlot (0-47), endSlot (1-48), effectiveFrom (string), effectiveTo (string|null). AvailabilityExceptionRequest: date (string), kind (AvailabilityKind enum), startSlot (number|null), endSlot (number|null). domain/member/types/res.ts에 MemberAvailabilityResponse 추가: memberId, weeklyRules (WeeklyRuleResponse[]), exceptions (AvailabilityExceptionResponse[]), note, updatedAt. 공통 enum: DayOfWeek (MONDAY~SUNDAY), AvailabilityKind (AVAILABLE|BLOCKED). 슬롯 체계: 30분 단위, slot 0=00:00, slot 18=09:00, slot 44=22:00. [startSlot, endSlot) 반열린 구간. index.ts에 새 타입 export 추가.

### 1.2. Availability API 함수 구현 (getMyAvailability, updateMyAvailability)

**Status:** done  
**Dependencies:** 1.1  

내 가용성 조회(GET /api/v1/me/availability) 및 등록/수정(PUT /api/v1/me/availability) API 함수를 구현한다.

**Details:**

domain/member/api/getMyAvailability.ts 생성: apiClient.get<MemberAvailabilityResponse>('/api/v1/me/availability') 호출. domain/member/api/updateMyAvailability.ts 생성: apiClient.put<MemberAvailabilityResponse>('/api/v1/me/availability', request) 호출. 기존 getMe.ts, updateMe.ts 패턴 참조. RequestConfig 타입 활용하여 인증 헤더 자동 주입. 에러 응답(400 AVAILABILITY_INVALID 등)은 apiClient 인터셉터에서 ApiError로 변환됨.

### 1.3. Availability TanStack Query 훅 구현 (useMyAvailability, useUpdateMyAvailability)

**Status:** done  
**Dependencies:** None  

가용성 조회/수정을 위한 TanStack Query 훅을 구현한다. 기존 useMe, useUpdateMe 패턴을 따른다.

**Details:**

domain/member/hooks/useMyAvailability.ts 생성: useQuery로 getMyAvailability 호출. queryKey는 queryKeys.member에 'availability' 키 추가 필요 (global/config/queryKeys.ts 수정). staleTime 5분. enabled 옵션으로 인증 여부 체크(useIsAuthenticated). domain/member/hooks/useUpdateMyAvailability.ts 생성: useMutation으로 updateMyAvailability 호출. onSuccess 시 queryClient.invalidateQueries로 availability 캐시 무효화. 기존 useUpdateMe.ts 패턴 참조하여 onSuccess/onError 콜백 옵션 지원.

### 1.4. WeeklyTimetable 컴포넌트 구현

**Status:** done  
**Dependencies:** 1.3  

주간 타임테이블 그리드 UI를 구현한다. 현재 주 날짜 헤더, 9:00~22:00 시간 그리드, 가용/불가 시간대 및 합주/공연 이벤트를 표시한다.

**Details:**

domain/member/components/WeeklyTimetable.client.tsx 생성. Props: weeklyRules, exceptions, practices (PracticeListItemResponse[]), performances (PerformanceListItemResponse[]), onManageClick 콜백. 헤더: 현재 주 월~일 날짜 표시 (yyyy-MM-dd (요일) 형식). lib/date.ts의 formatKst 활용. 그리드: 9:00~22:00 (slot 18~44), 30분 단위 행. 요일별 열 7개. 불가능 시간대(weeklyRules 없는 슬롯): bg-gray-500/50 회색 처리. 합주 이벤트: bg-yellow-500 노란색, title truncate. 공연 이벤트: bg-green-500 초록색, title truncate. 상단 오른쪽 [나의 스케줄 관리] 버튼 (variant='secondary', size='sm'). 반응형: 모바일에서 가로 스크롤. Tailwind CSS v4 토큰 사용.

### 1.5. ScheduleManagerModal 컴포넌트 구현 (2단계 모달)

**Status:** done  
**Dependencies:** 1.3, 1.4  

가능 시간대 설정을 위한 2단계 모달을 구현한다. Step 1에서 드래그/클릭으로 시간대 선택, Step 2에서 특이사항 입력 후 저장한다.

**Details:**

domain/member/components/ScheduleManagerModal.client.tsx 생성. Props: open, onOpenChange, initialData (MemberAvailabilityResponse|null), onSave 콜백. Dialog 컴포넌트 활용 (src/components/ui/dialog.tsx). 배경 오버레이 bg-black/50, 팝업 내부 bg-card. Step 1/2: 요일별 9:00~22:00 그리드. 클릭/드래그로 가능 시간대 선택 (coral/salmon 색상 bg-coral-500 또는 bg-orange-400). 선택된 슬롯은 weeklyRules로 변환. [스케줄 초기화] 버튼으로 전체 선택 해제. [다음] 버튼은 슬롯 1개 이상 선택 시 활성화. Step 2/2: 특이사항 textarea (max 500자). [이전] 버튼으로 Step 1 복귀. [완료] 버튼(항상 활성화)으로 useUpdateMyAvailability mutation 호출. 성공 시 onOpenChange(false) + toast.success. 로딩 중 버튼 비활성화.

### 1.6. MeContent에 WeeklyTimetable 섹션 통합

**Status:** done  
**Dependencies:** 1.4, 1.5  

MeContent.client.tsx의 프로필 정보 섹션 하단에 주간 타임테이블 섹션을 추가하고, 내 합주/공연 데이터를 fetching하여 전달한다.

**Details:**

MeContent.client.tsx 수정. useMyAvailability 훅으로 가용성 데이터 조회. useMyPractices, useMyPerformances 훅으로 내 합주/공연 목록 조회 (현재 주 필터링 필요시 클라이언트에서 처리). ScheduleManagerModal 상태 관리 (useState로 open/close). 프로필 정보 섹션(</section>) 이후, 계정 탈퇴 섹션 이전에 새 section 추가: <section> + h2 '주간 스케줄' + WeeklyTimetable. WeeklyTimetable에 onManageClick prop으로 모달 열기 핸들러 전달. ScheduleManagerModal 렌더링. 로딩 상태: WeeklyTimetable 영역에 Skeleton 표시. 에러 상태: ErrorState 컴포넌트 또는 인라인 메시지.
