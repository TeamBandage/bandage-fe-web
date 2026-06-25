<context>
# Overview
BD-93 공연 생성 페이지 UI 개선 및 셋리스트 API 연동. 기존 `PerformanceCreateWizard`는 주황색(accent) 포인트 버튼을 사용하고 셋리스트 선택이 Zustand mock store(`setlistStore`)에 의존하는 구조였다. 합주 생성 페이지(`JamCreateWizard`)의 흰색 포인트 UI 스타일을 기준으로 통일하고, `GET /api/v1/setlists/me` API를 실제 연동하여 사용자 셋리스트 목록을 보여준다.

핵심 출처
- 기존 구현: `src/app/(main)/performances/new/PerformanceCreateWizard.client.tsx`
- 참조 구현: `src/app/(main)/jams/new/JamCreateWizard.client.tsx`
- 백엔드 스펙: `openapi/openapi.json` — `PerformanceCreateRequest.setlistIds`, `GET /api/v1/setlists/me`

# Goals
1. **UI 테마 통일**: 합주 생성 페이지와 동일한 흰색 포인트 버튼·입력 필드 스타일 적용. `StepIndicator`에 `colorScheme="white"` 적용, 시작 시각·소요 시간을 카드형 박스로 개선.
2. **셋리스트 실API 연동**: mock Zustand store 의존 `SetlistPickerModal` 제거. `GET /api/v1/setlists/me`를 호출하는 `SetlistSelectorSheet` 신규 구현.
3. **백엔드 스펙 일치**: `CreatePerformanceRequest.setlistMeetingIds` → `setlistIds`로 필드명 수정 (백엔드 `PerformanceCreateRequest` 스펙과 일치).
4. **합주 생성 UX 보완**: 합주 생성 2단계(일정 설정)에 소제목 "일정을 설정하세요" 추가.
5. **소요 시간 조정 단위**: 공연 소요 시간 step을 30분 → 10분으로 변경.

# Non-goals
- 공연 생성 이후 셋리스트 추가/제거 API 연동 (`/api/v1/performances/{id}/setlists`)
- 셋리스트 검색/필터 기능
- 공연 생성 폼 zod 스키마에 setlistIds 검증 추가

# Existing architecture (재사용 대상)
- `src/components/ui/responsive-sheet.tsx` — 모바일 BottomSheet / 데스크톱 Dialog 자동 전환
- `src/domain/performance/hooks/useCreatePerformance.ts` — 공연 생성 mutation 훅 (재사용)
- `src/global/api/apiClient.ts` — fetch 클라이언트 (재사용)
- `src/global/config/queryKeys.ts` — TanStack Query 키 관리 (setlist 키 추가)
</context>
<PRD>
# Scope

## Task 1 — 공연 생성 페이지 UI 개선 및 셋리스트 API 연동

### 1.1 PerformanceCreateWizard UI 스타일 개선
- `StepIndicator`에 `colorScheme="white"` 적용
- 입력 필드 className에 `rounded-[5px] hover:border-white/30 focus-visible:border-white/80 focus-visible:ring-0` 적용
- 시작 시각·소요 시간을 `bg-surface border border-white/20 rounded-[5px]` 카드형 박스로 개선 (합주 생성과 동일 레이아웃)
- 버튼 스타일 `bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-white/30` 적용
- 소요 시간 `step` 속성 30 → 10으로 수정

### 1.2 setlist 도메인 신규 생성
- `src/domain/setlist/types/res.ts` — `SetlistResponse` (setlistId, title, trackSelectionId, managerId, createdAt, updatedAt)
- `src/domain/setlist/api/getMySetlists.ts` — `GET /api/v1/setlists/me` 호출 (pageSize 기본 50)
- `src/domain/setlist/hooks/useMySetlists.ts` — TanStack Query `useQuery` 래퍼
- `src/global/config/queryKeys.ts` — `queryKeys.setlist.my()` 추가

### 1.3 SetlistSelectorSheet 신규 구현
- `src/domain/performance/components/SetlistSelectorSheet.client.tsx`
- `useMySetlists` 훅으로 실제 API 데이터 렌더링
- 로딩·에러·빈 목록 상태 처리
- 선택 항목은 흰색 배지(`선택됨`)로 표시, 토글 방식 다중 선택
- 확인 버튼에 흰색 포인트 스타일 적용

### 1.4 CreatePerformanceRequest 타입 수정
- `src/domain/performance/types/req.ts` — `setlistMeetingIds` → `setlistIds`
- Wizard에서 `mutation.mutate` 시 `setlistIds: selectedSetlists.map(s => s.setlistId)` 전달

### 1.5 PerformanceCreateWizard 통합
- `SetlistPickerModal` (mock store 의존) 제거 → `SetlistSelectorSheet` 교체
- 선택된 셋리스트 태그 칩 스타일을 `border-white/20 bg-white/10 rounded-full`로 변경
- 스텝 레이블 `'셋리스트'` → `'셋리스트 추가'`로 수정

### JamCreateWizard 보완
- `src/app/(main)/jams/new/JamCreateWizard.client.tsx` Step 1에 `<h2>일정을 설정하세요</h2>` 소제목 추가

# Test Strategy
- 공연 생성 Step 0: 제목 필수 입력, 시작 시각 필수, 소요 시간 30분 미만 시 에러 토스트
- 공연 생성 Step 1: "셋리스트 선택" 버튼 클릭 → API 호출 → 셋리스트 목록 표시
- 셋리스트 없을 때 "참여 중인 셋리스트가 없습니다" 표시
- 셋리스트 선택 후 칩 표시, X 버튼으로 개별 제거
- Step 2 검토: 선택한 셋리스트 제목 콤마 구분 표시
- "공연 만들기" → `POST /api/v1/performances` body에 `setlistIds` 배열 포함 확인
- 합주 생성 Step 1에 "일정을 설정하세요" 소제목 노출 확인
</PRD>
