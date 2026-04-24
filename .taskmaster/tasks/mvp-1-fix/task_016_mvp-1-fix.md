# Task ID: 16

**Title:** 밴드/합주/공연 생성을 단계별 모달로 전환

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 현재 '/bands/new', '/practices/new', '/performances/new' 라우트로 분리된 생성 폼을 목록 페이지에서 호출되는 단계별(Step) 모달 플로우로 전환한다. StepIndicator 를 재사용하고 모바일에서는 ResponsiveSheet(BottomSheet) 로 자동 전환.

**Details:**

1) Band 생성 모달: Step 1 이름+설명, Step 2 프로필 이미지(선택) — /bands 페이지 상단 [새 밴드] 버튼이 모달을 연다. 2) Practice 생성 모달: Step 1 제목+곡, Step 2 장소, Step 3 시작시각(DateTimePicker)+소요시간. 3) Performance 생성 모달: Step 1 제목+밴드 선택, Step 2 시작시각+소요시간, Step 3 장소+설명. 4) ResponsiveSheet + StepIndicator 조합으로 구현, [다음]/[이전]/[생성] 버튼. 5) Controller + react-hook-form 으로 단계별 trigger validation. 6) 기존 /{domain}/new 라우트는 유지(직접 deep-link 가능) 하되 목록 페이지의 [새 X] 버튼은 모달을 띄우도록 변경. 7) 모바일: BottomSheet 85vh, 헤더/본문/푸터 스크롤. 8) 기존 Playwright 가드 테스트에 영향 없도록 라우트는 그대로 둠.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 16.1. 단계별 폼 공용 훅 및 타입 정의 (useSteppedForm)

**Status:** pending  
**Dependencies:** None  

단계별 폼 로직을 재사용할 수 있는 useSteppedForm 훅과 관련 타입을 구현한다. step 상태 관리, 단계별 필드 검증(trigger), 이전/다음 핸들러를 캡슐화한다.

**Details:**

1. src/hooks/useSteppedForm.ts 신규 생성
   - Generic 타입: <TSchema extends z.ZodType, Steps extends readonly string[]>
   - Props: form (UseFormReturn), steps (readonly string[]), fieldsPerStep (Record<number, (keyof z.infer<TSchema>)[]>)
   - 반환값: { currentStep, stepLabels, isFirstStep, isLastStep, goNext, goBack, canProceed }
   - goNext: fieldsPerStep[currentStep]에 해당하는 필드만 trigger() 후 성공 시 step++
   - goBack: step > 0 이면 step--
   - canProceed: 현재 스텝 필드 유효 여부

2. src/hooks/index.ts 배럴에 export 추가

3. 기존 JoinForm.client.tsx의 step 로직 참고하되, 도메인 독립적으로 추상화

### 16.2. BandCreateModal 컴포넌트 구현

**Status:** pending  
**Dependencies:** 16.1  

ResponsiveSheet + StepIndicator 조합으로 밴드 생성 2단계 모달을 구현한다. Step 1: 이름+설명, Step 2: 프로필 이미지(선택).

**Details:**

1. src/domain/band/components/BandCreateModal.client.tsx 신규 생성
   - Props: open, onOpenChange, onSuccess?
   - ResponsiveSheet > ResponsiveSheetContent 구조
   - Header: StepIndicator (steps=['기본 정보', '프로필'])
   - Body: step별 조건부 렌더링
     - Step 0: name(Input, required), description(Textarea)
     - Step 1: profileImg(Input type=url, optional)
   - Footer: [이전](goBack), [다음/생성](goNext 또는 submit)
   - useSteppedForm 훅 사용, fieldsPerStep: {0: ['name','description'], 1: ['profileImg']}
   - useCreateBand 뮤테이션 연동
   - 성공 시 onOpenChange(false) + 토스트 + router.push(ROUTES.BAND_DETAIL)

2. 모바일: BottomSheet 85vh, 스크롤 처리 ResponsiveSheetBody overflow-y-auto

3. 기존 BandCreateForm.client.tsx는 유지 (deep-link /bands/new 용)

### 16.3. PracticeCreateModal 컴포넌트 구현

**Status:** pending  
**Dependencies:** 16.1  

합주 생성 3단계 모달을 구현한다. Step 1: 제목+곡, Step 2: 장소, Step 3: 시작시각(DateTimePicker)+소요시간.

**Details:**

1. src/domain/practice/components/PracticeCreateModal.client.tsx 신규 생성
   - Props: open, onOpenChange, onSuccess?
   - StepIndicator steps=['곡 선택', '장소', '일정']
   - Step 0: title(Input), song(Select/Input - 곡 선택 UI)
   - Step 1: venue(Input)
   - Step 2: startAt(DateTimePicker with Controller), durationMinutes(Select: 15~480분)
   - fieldsPerStep: {0: ['title','song'], 1: ['venue'], 2: ['startAt','durationMinutes']}

2. useCreatePractice 뮤테이션 연동
   - 성공 시 모달 닫기 + 토스트 + router.push(ROUTES.PRACTICE_DETAIL)

3. 기존 PracticeCreateForm.client.tsx 유지 (/practices/new deep-link)

4. 모바일 BottomSheet 85vh, 내부 스크롤

### 16.4. PerformanceCreateModal 컴포넌트 구현

**Status:** pending  
**Dependencies:** 16.1  

공연 생성 3단계 모달을 구현한다. Step 1: 제목+밴드 선택, Step 2: 시작시각+소요시간, Step 3: 장소+설명.

**Details:**

1. src/domain/performance/components/PerformanceCreateModal.client.tsx 신규 생성
   - Props: open, onOpenChange, onSuccess?
   - StepIndicator steps=['기본 정보', '일정', '상세']
   - Step 0: title(Input, required), bandIds(multi-select or checkbox group)
   - Step 1: startAt(DateTimePicker), durationMinutes(Select: 30~600분)
   - Step 2: venue(Input), description(Textarea, optional)
   - fieldsPerStep: {0: ['title','bandIds'], 1: ['startAt','durationMinutes'], 2: ['venue']}

2. useCreatePerformance 뮤테이션 연동
   - bandIds 파싱 로직 기존 PerformanceCreateForm 참고
   - 성공 시 모달 닫기 + 토스트 + router.push(ROUTES.PERFORMANCE_DETAIL)

3. 기존 PerformanceCreateForm.client.tsx 유지

4. 모바일 BottomSheet 85vh, Body 스크롤

### 16.5. 목록 페이지 FAB 버튼을 모달 트리거로 전환

**Status:** pending  
**Dependencies:** 16.2, 16.3, 16.4  

/bands, /practices, /performances 페이지의 FAB 버튼을 Link에서 모달 open 트리거로 변경하고, 각 모달 컴포넌트를 페이지에 마운트한다.

**Details:**

1. src/app/(main)/bands/page.tsx 수정
   - 'use client' 추가 (모달 상태 관리 필요)
   - const [createOpen, setCreateOpen] = useState(false) 추가
   - FAB: <Link> 제거 → <button onClick={() => setCreateOpen(true)}>
   - <BandCreateModal open={createOpen} onOpenChange={setCreateOpen} /> 마운트

2. src/app/(main)/practices/page.tsx 동일 패턴 적용
   - <PracticeCreateModal /> 마운트

3. src/app/(main)/performances/page.tsx 동일 패턴 적용
   - <PerformanceCreateModal /> 마운트

4. 기존 /bands/new, /practices/new, /performances/new 라우트는 그대로 유지 (deep-link 호환)

5. Playwright 가드 테스트 영향 없음 확인 (라우트 미변경)
