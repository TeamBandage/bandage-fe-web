# Task ID: 5

**Title:** 마법사 검토(확정) 단계 + 리소스 생성 알림 표준화

**Status:** pending

**Dependencies:** 1, 2

**Priority:** high

**Description:** 합주/공연 생성 마법사의 마지막 단계에 입력값 전체를 검토할 수 있는 패널을 추가하고, 생성 성공 시 강조된 알림을 표시한다.

**Details:**

## 구현 대상

1. **WizardSummaryCard** (`src/components/ui/wizard-summary-card.tsx`)
   - 재사용 가능한 검토 패널
   - Props: `sections: Array<{ title: string, items: Array<{ label: string, value: string }>, onEdit?: () => void }>`
   - 렌더링: 카드 내 Section별 라벨/값 쌍 + 우측 "수정" 링크
   - 날짜/시간 항목은 success/accent 톤 + font-bold + text-title (Phase E-3 일관성)

2. **PracticeCreateWizard Step 4 추가**
   - STEPS 배열에 '검토' 추가
   - Step 3(메타) 완료 후 Step 4로 이동
   - WizardSummaryCard에 4개 Section: 밴드, 곡, 일정, 메타
   - 각 Section의 "수정" 버튼 → `setStep(해당 step)`
   - "합주 만들기" 버튼이 실제 mutation.mutate() 호출

3. **PerformanceCreateWizard Step 3** (Task 2와 연계)
   - 동일 패턴으로 검토 단계 추가

4. **ResourceCreatedToast 강화** (`src/components/feedback/resource-created-toast.tsx`)
   - 기존 toast.success 대신 더 시각적으로 강조된 토스트
   - Props: `title: string`, `message: string`, `cta: { label: string, href: string }`
   - 렌더링: 상단 아이콘(CheckCircle2 larger), 볼드 제목, CTA 버튼
   - 5초 후 자동 닫힘
   - `useResourceCreatedToast` 훅으로 호출 단순화

5. **기존 마법사 mutation.onSuccess 수정**
   - `toast.success` → `resourceCreatedToast.show({ title: '합주가 생성되었습니다', cta: { label: '보러가기', href: ... } })`

## 의사 코드
```tsx
// WizardSummaryCard
export function WizardSummaryCard({ sections }) {
  return (
    <div className="space-y-s-4">
      {sections.map((sec) => (
        <div key={sec.title} className="bg-card border rounded-md p-s-4">
          <div className="flex justify-between items-center mb-s-2">
            <h3 className="text-body font-semibold">{sec.title}</h3>
            {sec.onEdit && <button onClick={sec.onEdit} className="text-accent text-caption">수정</button>}
          </div>
          {sec.items.map(item => (
            <div key={item.label} className="flex justify-between text-caption">
              <span className="text-foreground-muted">{item.label}</span>
              <span className={item.highlight ? 'text-accent font-bold' : ''}>{item.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Test Strategy:**

1. 합주 마법사 Step 3 완료 → Step 4 검토 단계 노출
2. 검토 패널에 선택한 밴드/곡/일정/제목 정보 올바르게 표시
3. "수정" 버튼 클릭 → 해당 Step으로 이동
4. 검토 단계에서 "합주 만들기" → mutation 호출 + 성공 시 강화 토스트
5. 토스트 CTA 버튼 클릭 → 생성된 합주 상세 페이지 이동
6. 토스트 5초 후 자동 닫힘
7. 공연 마법사 동일 동작 확인 (Task 2 완료 후)

## Subtasks

### 5.1. WizardSummaryCard 재사용 컴포넌트 구현

**Status:** pending  
**Dependencies:** None  

합주/공연 마법사의 검토 단계에서 사용할 재사용 가능한 요약 카드 컴포넌트를 구현한다.

**Details:**

## 구현 파일
`src/components/ui/wizard-summary-card.tsx`

## Props 인터페이스
```typescript
type SummaryItem = {
  label: string;
  value: string;
  highlight?: boolean; // true면 text-accent font-bold 적용
};

type SummarySection = {
  title: string;
  items: SummaryItem[];
  onEdit?: () => void;
};

type WizardSummaryCardProps = {
  sections: SummarySection[];
  className?: string;
};
```

## 렌더링 구조
- 전체: `space-y-s-4` 컨테이너
- 섹션별: `bg-card border-border rounded-md border p-s-4`
- 헤더: `flex justify-between items-center mb-s-2`
  - 제목: `text-body font-semibold`
  - 수정 버튼: `text-accent text-caption hover:underline` (onEdit 있을 때만)
- 항목: `flex justify-between text-caption py-s-1`
  - 라벨: `text-foreground-muted`
  - 값: 기본 `text-foreground`, highlight면 `text-accent font-bold`

## 접근성
- 수정 버튼에 `aria-label="{섹션명} 수정"` 추가
- 섹션별 `role="group"` + `aria-labelledby`

## 기존 Card 컴포넌트 활용
기존 `src/components/ui/card.tsx`의 Card 컴포넌트를 활용하거나, 디자인 일관성을 위해 동일한 스타일링 패턴 적용

### 5.2. PracticeCreateWizard Step 4 검토 단계 추가

**Status:** pending  
**Dependencies:** 5.1  

합주 생성 마법사에 4번째 단계(검토)를 추가하여 입력값 전체를 확인하고 수정할 수 있도록 한다.

**Details:**

## 수정 파일
`src/app/(main)/practices/new/PracticeCreateWizard.client.tsx`

## 변경 사항

### 1. STEPS 배열 확장
```typescript
const STEPS = ['밴드 선택', '곡 선택', '일정 설정', '검토'] as const;
```

### 2. step 타입 확장
```typescript
const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
```

### 3. Step 3(메타) 완료 후 Step 4로 이동
- `next()` 함수에서 step 2 → 3 전환 로직 추가
- `canNext` 조건 수정: step 2일 때 startAt + durationMinutes 검증 후 next 가능

### 4. Step 4 검토 섹션 추가
```tsx
{step === 3 && (
  <section data-slot="wizard-step-review">
    <WizardSummaryCard
      sections={[
        {
          title: '밴드',
          items: [{ label: '선택한 밴드', value: selectedBandName }],
          onEdit: () => setStep(0),
        },
        {
          title: '곡',
          items: [
            { label: '곡 제목', value: songTitle },
            { label: '아티스트', value: songArtist },
          ],
          onEdit: () => setStep(1),
        },
        {
          title: '일정',
          items: [
            { label: '시작 시각', value: formatKst(startAt), highlight: true },
            { label: '소요 시간', value: `${durationMinutes}분` },
          ],
          onEdit: () => setStep(2),
        },
        {
          title: '메타',
          items: [
            { label: '합주 제목', value: title || '(미입력)' },
            { label: '장소', value: venue || '(미입력)' },
          ],
          onEdit: () => setStep(2),
        },
      ]}
    />
  </section>
)}
```

### 5. 하단 버튼 로직 수정
- step < 3일 때 '다음' 버튼
- step === 3일 때 '합주 만들기' 버튼 (mutation.mutate 호출)
- canSubmit 조건을 step === 3으로 변경

### 6. 헬퍼 함수 추가
- 선택된 밴드 이름 조회: `myBands.data?.find(b => b.bandId === bandId)?.bandName`
- 날짜 포맷팅: `lib/date.ts`의 `formatKst` 사용

### 5.3. ResourceCreatedToast 강화 컴포넌트 및 훅 구현

**Status:** pending  
**Dependencies:** None  

리소스 생성 성공 시 시각적으로 강조된 토스트와 CTA 버튼을 제공하는 컴포넌트 및 훅을 구현한다.

**Details:**

## 구현 파일
1. `src/components/feedback/resource-created-toast.tsx` - 강화 토스트 컴포넌트
2. `src/hooks/useResourceCreatedToast.ts` - 호출 단순화 훅

## ResourceCreatedToast 컴포넌트
### Props
```typescript
type ResourceCreatedToastProps = {
  id: string;
  title: string;
  message?: string;
  cta?: { label: string; href: string };
  onDismiss: (id: string) => void;
};
```

### 렌더링 구조
- 컨테이너: 기존 Toast보다 넓은 `w-96`, `bg-card border-success/60 shadow-xl`
- 상단: CheckCircle2 아이콘 `h-6 w-6 text-success` (기존보다 큼)
- 제목: `text-body font-bold text-foreground`
- 메시지(선택): `text-caption text-foreground-muted`
- CTA 버튼: `Button variant="accent-outline" size="sm"` + Link 조합
- 닫기 버튼: 우측 상단 X 아이콘
- 5초 후 자동 닫힘 (useEffect + setTimeout)

### 애니메이션
- 기존 `animate-toast-in` 클래스 재사용

## useResourceCreatedToast 훅
```typescript
type ShowOptions = {
  title: string;
  message?: string;
  cta?: { label: string; href: string };
};

export function useResourceCreatedToast() {
  const addRich = useToastStore((s) => s.addRich); // 새 store 메서드 필요
  const remove = useToastStore((s) => s.remove);

  const show = useCallback((options: ShowOptions) => {
    return addRich({ ...options, type: 'resource-created', duration: 5000 });
  }, [addRich]);

  return { show, dismiss: remove };
}
```

## ToastStore 확장 (대안 접근)
기존 store를 최소 변경하려면, 별도의 resourceCreatedToastStore를 생성하거나 기존 Toast 타입에 'resource-created' 추가 + Toast 컴포넌트에서 분기 렌더링

### 5.4. 마법사 mutation.onSuccess 강화 토스트 적용

**Status:** pending  
**Dependencies:** 5.2, 5.3  

PracticeCreateWizard와 PerformanceCreateWizard의 생성 성공 시 기존 toast.success 대신 강화된 ResourceCreatedToast를 표시하도록 수정한다.

**Details:**

## 수정 파일
1. `src/app/(main)/practices/new/PracticeCreateWizard.client.tsx`
2. `src/app/(main)/performances/new/PerformanceCreateForm.client.tsx` (또는 Task 2 완료 후 PerformanceCreateWizard)

## PracticeCreateWizard 수정
### 1. 훅 import 추가
```typescript
import { useResourceCreatedToast } from '@/hooks/useResourceCreatedToast';
```

### 2. 훅 초기화
```typescript
const resourceCreatedToast = useResourceCreatedToast();
```

### 3. mutation.onSuccess 수정
```typescript
const mutation = useCreatePractice({
  onSuccess: (data) => {
    resourceCreatedToast.show({
      title: '합주가 생성되었습니다',
      cta: {
        label: '보러가기',
        href: ROUTES.PRACTICE_DETAIL(data.practiceId),
      },
    });
    router.replace(ROUTES.PRACTICE_DETAIL(data.practiceId));
  },
  onError: (err) => toast.error(err.message || '합주 생성에 실패했습니다.'),
});
```

## PerformanceCreateForm (또는 Wizard) 수정
동일 패턴 적용:
```typescript
const mutation = useCreatePerformance({
  onSuccess: (data) => {
    resourceCreatedToast.show({
      title: '공연이 생성되었습니다',
      cta: {
        label: '보러가기',
        href: ROUTES.PERFORMANCE_DETAIL(data.performanceId),
      },
    });
    router.replace(ROUTES.PERFORMANCE_DETAIL(data.performanceId));
  },
  onError: (err) => toast.error(err.message || '공연 생성에 실패했습니다.'),
});
```

## 참고 사항
- router.replace는 유지하여 뒤로가기 시 마법사로 돌아가지 않도록 함
- 강화 토스트는 상세 페이지로 이동 후에도 표시됨 (CTA 클릭 시 무시됨)
- Task 2(PerformanceCreateWizard)가 완료된 후 해당 파일에도 적용 필요
