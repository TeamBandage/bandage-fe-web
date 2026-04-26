# Task ID: 5

**Title:** UUID 직접 입력 제거 — 검색 모달 패턴 일반화 (밴드/곡/합주/멤버)

**Status:** pending

**Dependencies:** 1

**Priority:** medium

**Description:** 공연 생성 폼에서 bandIds UUID textarea 입력을 제거하고, 메타데이터만으로 1차 생성 후 별도 '참여 밴드 추가' 모달에서 밴드 검색 + 다중 선택을 구현한다.

**Details:**

**1. 공연 생성 폼 수정 (`src/app/(main)/performances/new/PerformanceCreateForm.client.tsx`):**
- `bandIdsRaw` textarea 입력 필드 제거
- 제출 시 `bandIds: []` 또는 미포함 (빈 배열 허용됨 - API_SPEC §6-1)
- 생성 성공 후 상세 화면으로 이동

**2. 공연 상세 화면 수정 (`src/app/(main)/performances/[performanceId]/PerformanceDetailContent.client.tsx`):**
- PerformanceManager 권한일 때 "참여 밴드 추가" 버튼 노출
- 버튼 클릭 시 `PerformanceBandPickerModal` 오픈

**3. 밴드 선택 모달 (`src/domain/performance/components/PerformanceBandPickerModal.client.tsx` 신규):**
- ResponsiveSheet 또는 Dialog 기반
- keyword input → 디바운스 → `GET /api/v1/bands/search` 호출
- 검색 결과 카드에 체크박스 다중 선택
- 확인 버튼 클릭 시 선택된 bandIds 전달
- EmptyState: "탐색하려는 밴드명을 입력하세요" (미입력 시)
- 결과 0건: EmptyState "검색 결과가 없습니다"

**4. 연동 API (mock/placeholder):**
- 백엔드 `PATCH /performances/{id}` 에 `bandIds` 필드 미지원 (API_SPEC §6-4 확인)
- 본 라운드: mock fetcher 로 UI/UX 완성
- API_REQUIRED.md 에 FE-API-017 신규 항목 등록:
  - `PATCH /api/v1/performances/{performanceId}` Request Body 에 `bandIds: string[]` 필드 추가 요청
  - 또는 `POST /api/v1/performances/{performanceId}/bands/batch` 신규 엔드포인트

**5. 밴드 검색 hook 활용:**
- Task 1 에서 구현한 `searchBands` API + `useBandSearch` hook 재사용

**Test Strategy:**

1. 공연 생성 폼에서 bandIds textarea 가 제거되었는지 확인
2. 공연 생성 성공 후 상세 화면 라우팅 확인
3. 상세 화면에서 "참여 밴드 추가" 버튼 표시 (Manager 권한 시)
4. 모달 내 밴드 검색 → 다중 선택 → 확인 플로우 시각 확인
5. API_REQUIRED.md 에 FE-API-017 항목 추가 확인
6. `pnpm typecheck && pnpm lint` 통과

## Subtasks

### 5.1. 공연 생성 폼에서 bandIdsRaw textarea 제거 및 빈 배열 제출 처리

**Status:** pending  
**Dependencies:** None  

PerformanceCreateForm.client.tsx에서 UUID 직접 입력 textarea 필드를 제거하고, 공연 생성 시 bandIds를 빈 배열 또는 미포함으로 변경한다.

**Details:**

**수정 파일:** `src/app/(main)/performances/new/PerformanceCreateForm.client.tsx`

**변경 사항:**
1. `FormValues` 타입에서 `bandIdsRaw?: string` 필드 제거
2. 108-113 라인의 `<Textarea label="참여 밴드 ID (선택)" ... />` 컴포넌트 제거
3. `form.handleSubmit` 콜백에서 bandIdsRaw 파싱 로직(45-51 라인) 제거
4. mutation.mutate 호출 시 `bandIds` 필드를 생략하거나 `undefined`로 전달 (API_SPEC §6-1에 따라 빈 배열이 기본값)
5. 생성 성공 후 상세 화면(`ROUTES.PERFORMANCE_DETAIL`)으로 라우팅은 기존 유지

**API_SPEC 확인:** §6-1에서 `bandIds: optional (기본값 빈 배열)`로 명시됨.

### 5.2. 공연 상세 화면에 '참여 밴드 추가' 버튼 노출 (Manager 권한 조건부)

**Status:** pending  
**Dependencies:** 5.1  

PerformanceDetailContent.client.tsx의 참여 밴드 탭에 PerformanceManager 권한일 때만 '참여 밴드 추가' 버튼을 노출하고, 모달 오픈 상태를 관리한다.

**Details:**

**수정 파일:** `src/app/(main)/performances/[performanceId]/PerformanceDetailContent.client.tsx`

**변경 사항:**
1. 상단에 `bandPickerOpen` 상태 추가: `const [bandPickerOpen, setBandPickerOpen] = useState(false);`
2. 'bands' TabsContent (137-141 라인) 내 Card 컴포넌트의 header를 조건부 렌더링으로 변경:
   ```tsx
   <Card
     header={
       <div className="flex items-center justify-between">
         <span>참여 밴드</span>
         {isManager && (
           <Button size="sm" onClick={() => setBandPickerOpen(true)}>
             <Plus className="h-4 w-4" />
             밴드 추가
           </Button>
         )}
       </div>
     }
     padding="md"
   >
   ```
3. 컴포넌트 하단에 `PerformanceBandPickerModal` 렌더링 준비 (다음 서브태스크에서 구현)
4. 기존 useIsPerformanceManager 훅의 isManager 반환값 활용

### 5.3. PerformanceBandPickerModal 컴포넌트 신규 구현 (밴드 검색 + 다중 선택 UI)

**Status:** pending  
**Dependencies:** 5.2  

ResponsiveSheet 기반의 밴드 선택 모달을 신규 구현한다. 키워드 입력 → 디바운스 → 검색 결과 표시 → 체크박스 다중 선택 → 확인 플로우를 제공한다.

**Details:**

**신규 파일:** `src/domain/performance/components/PerformanceBandPickerModal.client.tsx`

**구현 명세:**
1. Props 인터페이스:
   ```tsx
   interface PerformanceBandPickerModalProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     performanceId: string;
     excludeBandIds?: string[]; // 이미 참여 중인 밴드 제외
     onConfirm: (bandIds: string[]) => void;
   }
   ```

2. 상태 관리:
   - `keyword: string` — 검색어 입력
   - `debouncedKeyword` — useDebounce(keyword, 300) 적용
   - `selectedBandIds: string[]` — 선택된 밴드 ID 배열

3. UI 구조 (ResponsiveSheet 기반):
   - Header: "참여 밴드 선택" 제목
   - Body:
     - Input (검색어 입력, placeholder: "밴드명으로 검색")
     - 검색어 미입력 시: EmptyState (title: "밴드명을 입력하세요")
     - 검색 결과 0건 시: EmptyState (title: "검색 결과가 없습니다")
     - 검색 결과 있을 시: 밴드 카드 목록 (체크박스 + 밴드명 + 설명)
   - Footer: 취소 버튼 + 확인 버튼 (선택 개수 표시)

4. 검색 API 연동:
   - Task 1에서 구현될 `searchBands` API / `useBandSearch` 훅 사용 예정
   - 현재는 mock fetcher 또는 placeholder 훅으로 대체

5. 체크박스 다중 선택:
   - excludeBandIds에 포함된 밴드는 disabled + "이미 참여 중" 표시
   - 선택 토글 시 selectedBandIds 배열 업데이트

**활용 UI 컴포넌트:** ResponsiveSheet, Input, Button, Checkbox, EmptyState

### 5.4. 공연 상세 화면에 PerformanceBandPickerModal 연동 및 mock API 처리

**Status:** pending  
**Dependencies:** 5.3  

PerformanceDetailContent에 PerformanceBandPickerModal을 연동하고, 백엔드 API 미지원으로 mock fetcher를 사용한 UI/UX 완성 및 사용자 피드백 처리를 구현한다.

**Details:**

**수정 파일:** `src/app/(main)/performances/[performanceId]/PerformanceDetailContent.client.tsx`

**변경 사항:**
1. PerformanceBandPickerModal import 추가
2. 모달 연동:
   ```tsx
   <PerformanceBandPickerModal
     open={bandPickerOpen}
     onOpenChange={setBandPickerOpen}
     performanceId={performanceId}
     excludeBandIds={perf?.bandIds ?? []}
     onConfirm={handleAddBands}
   />
   ```

3. handleAddBands 콜백 구현 (mock 처리):
   - 백엔드 `PATCH /performances/{id}` bandIds 필드 미지원 (API_SPEC §6-4 확인)
   - toast.info로 "밴드 추가 기능은 준비 중입니다" 메시지 표시
   - 또는 console.log로 선택된 bandIds 출력 (디버깅용)
   - 모달 닫기

4. 기존 PerformanceBandChips 컴포넌트는 그대로 유지 (bandIds가 있으면 표시)

**Mock 전략:** API_SPEC §6-4에서 UpdatePerformanceRequest에 bandIds 필드가 없음. UI/UX는 완성하되 실제 저장은 백엔드 API 추가 후 활성화.

### 5.5. API_REQUIRED.md에 FE-API-017 신규 항목 등록 (공연 밴드 수정 API 요청)

**Status:** pending  
**Dependencies:** 5.4  

백엔드에 공연 참여 밴드 수정 API 추가를 요청하는 FE-API-017 항목을 API_REQUIRED.md에 등록한다.

**Details:**

**수정 파일:** `API_REQUIRED.md`

**추가 항목 (신규 기능 섹션에 추가):**
```markdown
### FE-API-017. 공연 참여 밴드 수정 (Task 5 / UUID 직접 입력 제거)

**현재 상태:** `PATCH /api/v1/performances/{performanceId}` 의 Request Body에 `bandIds` 필드 미지원

**프론트 사용처:** 
- `src/domain/performance/components/PerformanceBandPickerModal.client.tsx`
- 공연 상세 화면 "참여 밴드 추가" 기능

**요청 옵션 (택 1):**

**옵션 A:** 기존 PATCH 엔드포인트 확장
```http
PATCH /api/v1/performances/{performanceId}
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "bandIds": ["uuid-1", "uuid-2"]  // 전체 교체 (덮어쓰기)
}
```

**옵션 B:** 밴드 추가/제거 전용 엔드포인트 신규
```http
POST /api/v1/performances/{performanceId}/bands
{ "bandIds": ["uuid-1", "uuid-2"] }  // 추가

DELETE /api/v1/performances/{performanceId}/bands/{bandId}  // 개별 제거
```

**기대 응답:** 기존 `PerformanceDetailResponse` 또는 성공 여부만 반환

**프론트 mock 현황:** UI/UX 완성, toast로 "준비 중" 안내. 백엔드 구현 후 fetcher 교체로 즉시 활성화.
```

**위치:** '신규 기능' 섹션 (§ FE-API-017)
