# Task ID: 7

**Title:** 마법사 밴드 선택 6개 그리드 + 검색 통합

**Status:** pending

**Dependencies:** 2

**Priority:** medium

**Description:** 합주/공연 생성 마법사의 밴드 선택 단계에서 최대 6개 카드 그리드를 표시하고, '전체 보기/검색' 버튼으로 BandPickerModal을 연다.

**Details:**

## 구현 대상

1. **PracticeCreateWizard Step 1 수정**
   - `useMyBands(6)` 으로 최대 6개만 fetch
   - 그리드: `grid-cols-2 sm:grid-cols-3` (2×3 레이아웃)
   - 6개 초과 밴드가 있는 경우 "전체 보기" 버튼 표시
   - 버튼 클릭 → BandPickerModal 오픈 (single 선택 모드)
   - 모달에서 선택한 밴드 → `setBandId(selected.bandId)`
   - 선택된 밴드가 6개 그리드에 없으면 별도 "선택됨" 카드로 상단 표시

2. **PerformanceCreateWizard Step 1 (Task 2)** 동일 패턴
   - 다중 선택(multiple) 이므로 조금 다른 UX
   - 그리드 + "더 추가" 버튼 → BandPickerModal multiple
   - 선택된 밴드들을 칩 형태로 표시

3. **밴드 카드 선택 시각 강조** (Task 8-4와 연계)
   - 선택된 카드: 좌측 2px accent 보더 + 우상단 ✓ 아이콘 + bg-accent-dim

## 의사 코드
```tsx
// PracticeCreateWizard Step 1
const myBands = useMyBands(6);
const hasMore = myBands.total > 6; // total count from API or hasNext
const [pickerOpen, setPickerOpen] = useState(false);

return (
  <section>
    <h2>합주를 진행할 밴드를 선택하세요</h2>
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-s-2">
      {myBands.data?.slice(0, 6).map(b => (
        <BandSelectCard key={b.bandId} band={b} selected={b.bandId === bandId} onSelect={() => setBandId(b.bandId)} />
      ))}
    </ul>
    {hasMore && (
      <Button variant="secondary" onClick={() => setPickerOpen(true)}>전체 보기 / 검색</Button>
    )}
    <BandPickerModal
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      multiple={false}
      onConfirm={([band]) => setBandId(band.bandId)}
    />
  </section>
);
```

**Test Strategy:**

1. 6개 미만 밴드 소속 → 그리드에 모든 밴드 표시, "전체 보기" 버튼 미표시
2. 7개 이상 밴드 소속 → 6개 그리드 + "전체 보기" 버튼 표시
3. "전체 보기" 클릭 → BandPickerModal 오픈
4. 모달에서 밴드 선택 → 그리드에 없던 밴드면 상단에 "선택됨" 카드 표시
5. 카드 선택 시 좌측 보더 + ✓ 아이콘 시각 확인
6. 공연 마법사 다중 선택 모드 동작 확인

## Subtasks

### 7.1. useMyBands 훅 확장 — hasNext 반환 지원

**Status:** pending  
**Dependencies:** None  

현재 useMyBands 훅은 content 배열만 반환하지만, '전체 보기' 버튼 표시 여부 결정을 위해 hasNext 플래그도 함께 반환하도록 확장합니다.

**Details:**

## 수정 파일
- `src/domain/band/hooks/useMyBands.ts`

## 변경 내용
1. 반환 타입을 `{ data: MyBandInfoResponse[], hasNext: boolean }` 구조로 확장
2. getMyBands API가 반환하는 CursorResponse의 hasNext 필드를 함께 반환
3. 기존 호출부(PracticeCreateWizard)와의 하위 호환성 유지 — data.data 또는 data 자체로 접근 가능

## 의사 코드
```ts
export function useMyBands(limit = 10) {
  return useQuery({
    queryKey: [...queryKeys.band.my(), limit],
    queryFn: async () => {
      const page = await getMyBands({ pageSize: limit });
      return { data: page.content, hasNext: page.hasNext };
    },
  });
}
```

## 참조
- `src/domain/band/api/getMyBands.ts` — CursorResponse<T, string> 반환
- `src/global/types/index.ts` — CursorResponse 타입 정의

### 7.2. PracticeCreateWizard Step 1 그리드 레이아웃 및 BandPickerModal 통합

**Status:** pending  
**Dependencies:** 7.1  

합주 생성 마법사 Step 1을 2x3 그리드(최대 6개)로 변경하고, hasNext=true일 때 '전체 보기/검색' 버튼을 표시하여 BandPickerModal을 연결합니다.

**Details:**

## 수정 파일
- `src/app/(main)/practices/new/PracticeCreateWizard.client.tsx`

## 변경 내용
1. **useMyBands 호출 변경**: `useMyBands(50)` → `useMyBands(6)`
2. **그리드 레이아웃**: `grid-cols-1 sm:grid-cols-2` → `grid-cols-2 sm:grid-cols-3`
3. **hasNext 조건부 버튼**: hasNext=true일 때 '전체 보기/검색' 버튼 표시
4. **BandPickerModal 상태 추가**: `pickerOpen` state + BandPickerModal import
5. **모달 onConfirm 핸들러**: 선택한 밴드의 bandId를 setBandId에 설정
6. **선택된 밴드가 그리드에 없을 때 상단 표시**: 모달에서 선택한 밴드가 6개 그리드에 없으면 별도 '선택됨' 카드로 상단에 표시

## 추가 import
```ts
import { BandPickerModal } from '@/domain/band/components/BandPickerModal.client';
import type { BandInfoResponse } from '@/domain/band/types';
```

## 참조
- `src/domain/band/components/BandPickerModal.client.tsx` — multiple=false (단일 선택)
- 기존 PracticeCreateWizard.client.tsx:134-166 (현재 Step 1 구현)

### 7.3. PerformanceCreateWizard Step 1 (밴드 선택) 그리드 + 다중 선택 모드 구현

**Status:** pending  
**Dependencies:** 7.1  

공연 생성 마법사 Step 1에 6개 밴드 그리드를 추가하고, '더 추가' 버튼으로 BandPickerModal(multiple 모드)을 연결합니다. 선택된 밴드는 칩 형태로 표시합니다.

**Details:**

## 수정 파일
- `src/domain/performance/components/PerformanceCreateModal.client.tsx`
- `src/app/(main)/performances/new/PerformanceCreateForm.client.tsx` (동일 패턴 적용)

## 변경 내용 (PerformanceCreateModal Step 0)
1. **useMyBands 훅 추가**: `useMyBands(6)` import 및 호출
2. **그리드 레이아웃 추가**: Step 0에 2x3 밴드 그리드 (grid-cols-2 sm:grid-cols-3)
3. **기존 칩 UI 유지**: selectedBands를 칩으로 표시 (현재 구현 유지)
4. **그리드 카드 클릭 → 토글**: 그리드 카드 클릭 시 selectedBands에 추가/제거
5. **'더 추가' 버튼 조건**: hasNext=true 또는 selectedBands에 그리드에 없는 밴드가 있을 때
6. **BandPickerModal multiple=true**: 다중 선택 모드로 모달 연결

## 의사 코드
```tsx
// Step 0 수정
{step === 0 && (
  <>
    <Input ... />
    <div className="space-y-s-2">
      <label>참여 밴드</label>
      {/* 선택된 밴드 칩 */}
      {selectedBands.length > 0 && (
        <ul className="flex flex-wrap gap-s-2">...</ul>
      )}
      {/* 6개 그리드 */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-s-2">
        {myBands.data?.data.map(b => (
          <BandSelectCard band={b} selected={isSelected} onToggle={toggle} />
        ))}
      </ul>
      {hasNext && (
        <Button onClick={() => setPickerOpen(true)}>더 추가</Button>
      )}
    </div>
  </>
)}
```

## 참조
- PerformanceCreateModal.client.tsx:102-153 (현재 Step 0)
- PerformanceCreateForm.client.tsx:107-145 (폼 버전 밴드 선택)

### 7.4. 밴드 카드 선택 시각 강조 통합 (좌측 보더 + 체크 아이콘)

**Status:** pending  
**Dependencies:** 7.2, 7.3  

밴드 선택 카드에 선택 시각 강조를 적용합니다: 좌측 2px accent 보더 + 우상단 체크 아이콘 + bg-accent-dim 배경.

**Details:**

## 수정 파일
1. `src/app/(main)/practices/new/PracticeCreateWizard.client.tsx` — Step 1 밴드 카드
2. `src/domain/performance/components/PerformanceCreateModal.client.tsx` — Step 0 밴드 카드
3. `src/domain/band/components/BandPickerModal.client.tsx` — 모달 내 renderItem

## 시각 강조 패턴
1. **기본 상태**: `border-border bg-card hover:bg-card-hover`
2. **선택 상태**: 
   - `border-l-2 border-l-accent border-accent bg-accent-dim`
   - 우상단 체크 아이콘: `<Check className="h-4 w-4 text-accent" />`
   - 아이콘 위치: `absolute top-2 right-2` 또는 flex justify-between

## 공통 카드 구조 예시
```tsx
<button
  className={
    'relative border bg-card hover:bg-card-hover gap-s-3 px-s-4 py-s-3 flex w-full items-center rounded-md text-left transition-colors ' +
    (selected ? 'border-l-2 border-l-accent border-accent bg-accent-dim' : 'border-border')
  }
  aria-pressed={selected}
>
  {selected && (
    <span className="absolute top-2 right-2 text-accent">
      <Check className="h-4 w-4" />
    </span>
  )}
  {/* 카드 내용 */}
</button>
```

## 참조
- StepIndicator의 Check 아이콘 사용 패턴 (lucide-react)
- 기존 선택 강조: `border-accent bg-accent-dim` (PracticeCreateWizard.client.tsx:145)
