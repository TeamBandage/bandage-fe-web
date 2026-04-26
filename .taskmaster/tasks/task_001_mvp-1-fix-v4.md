# Task ID: 1

**Title:** 마법사 이탈 가드(Navigation Guard) 구현

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 사이드바 탭 전환 / 라우트 이탈 / 브라우저 뒤로가기 시 dirty 상태 마법사가 있으면 경고 모달을 표시하여 사용자가 입력 손실을 인지하도록 한다.

**Details:**

## 구현 대상

1. **DirtyFormContext** (`src/global/navigation/dirty-form-context.tsx`)
   - `createContext`로 Provider/Consumer 생성
   - 상태: `{ isDirty: boolean, setDirty: (dirty: boolean) => void }`
   - `DirtyFormProvider` 컴포넌트를 `src/app/(main)/layout.tsx`의 `<AuthBootstrapper>` 하위에 배치

2. **LeaveConfirmDialog** (`src/components/feedback/leave-confirm-dialog.tsx`)
   - 기존 `Dialog` 컴포넌트 활용
   - Props: `open`, `onConfirm: () => void`, `onCancel: () => void`
   - 카피: "작성 중인 내용이 있습니다. 정말 나가시겠어요?"
   - 버튼: "머무르기"(취소), "나가기"(확인, danger 스타일)

3. **Sidebar Link 인터셉트** (`src/components/layout/sidebar.tsx`)
   - `useDirtyForm()` hook으로 `isDirty` 조회
   - `Link`를 래핑한 `GuardedLink` 컴포넌트로 대체
   - `onClick` 핸들러에서 `isDirty` 확인 → 모달 오픈 → 확인 시 `setDirty(false)` 후 router.push
   - `e.preventDefault()` 로 기본 동작 차단

4. **브라우저 이벤트 훅** (`src/hooks/useBeforeUnload.ts`)
   - `useEffect`로 `beforeunload` 이벤트 등록/해제
   - `e.preventDefault(); e.returnValue = ''` 로 브라우저 기본 경고

5. **마법사 dirty 플래그 연동** (`PracticeCreateWizard.client.tsx`)
   - `useDirtyForm()` 훅 호출
   - step > 0 또는 bandId/songPick 등 입력값 존재 시 `setDirty(true)`, 그 외 `setDirty(false)`
   - 제출 성공 시 `setDirty(false)`

## 의사 코드
```tsx
// DirtyFormContext
export const DirtyFormContext = createContext({ isDirty: false, setDirty: () => {} });
export function useDirtyForm() { return useContext(DirtyFormContext); }
export function DirtyFormProvider({ children }) {
  const [isDirty, setDirty] = useState(false);
  return <DirtyFormContext.Provider value={{ isDirty, setDirty }}>{children}</DirtyFormContext.Provider>;
}

// GuardedLink in Sidebar
function GuardedLink({ href, children }) {
  const { isDirty, setDirty } = useDirtyForm();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const handleClick = (e) => {
    if (isDirty) { e.preventDefault(); setConfirmOpen(true); }
  };
  const onConfirm = () => { setDirty(false); router.push(href); };
  return (
    <>
      <Link href={href} onClick={handleClick}>{children}</Link>
      <LeaveConfirmDialog open={confirmOpen} onConfirm={onConfirm} onCancel={() => setConfirmOpen(false)} />
    </>
  );
}
```

**Test Strategy:**

1. 마법사에서 밴드 선택 후 사이드바 "홈" 클릭 → LeaveConfirmDialog 노출 확인
2. "머무르기" 클릭 → 모달 닫힘, 라우트 유지
3. "나가기" 클릭 → 홈으로 이동
4. step 0 + 입력값 없음 상태 → 경고 없이 바로 이동
5. 브라우저 새로고침/뒤로가기 시 네이티브 beforeunload 경고 표시
6. 제출 성공 후 사이드바 이동 시 경고 없음
7. Vitest 단위 테스트: DirtyFormContext 상태 변경 로직

## Subtasks

### 1.1. DirtyFormContext 및 Provider 생성 + 레이아웃 통합

**Status:** pending  
**Dependencies:** None  

전역 dirty 상태를 관리하는 React Context와 Provider를 생성하고, (main) 레이아웃의 AuthBootstrapper 하위에 배치합니다.

**Details:**

1. `src/global/navigation/dirty-form-context.tsx` 파일 생성
   - `DirtyFormContextType` 인터페이스 정의: `{ isDirty: boolean; setDirty: (dirty: boolean) => void }`
   - `createContext`로 기본값 `{ isDirty: false, setDirty: () => {} }` 설정
   - `DirtyFormProvider` 컴포넌트 구현: `useState`로 `isDirty` 상태 관리
   - `useDirtyForm()` 커스텀 훅 export: `useContext(DirtyFormContext)` 래핑

2. `src/app/(main)/layout.tsx` 수정
   - `DirtyFormProvider` import 추가
   - `<AuthBootstrapper>` 내부 children을 `<DirtyFormProvider>`로 래핑
   - Desktop과 Mobile 영역 모두 동일하게 적용

### 1.2. LeaveConfirmDialog 및 useBeforeUnload 훅 구현

**Status:** pending  
**Dependencies:** 1.1  

이탈 경고 모달 컴포넌트와 브라우저 beforeunload 이벤트 핸들링 훅을 구현합니다.

**Details:**

1. `src/components/feedback/leave-confirm-dialog.tsx` 파일 생성
   - Props: `open: boolean`, `onConfirm: () => void`, `onCancel: () => void`
   - 기존 `Dialog`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogTitle`, `DialogDescription` 컴포넌트 활용
   - 카피: 제목 "작성 중인 내용이 있습니다", 설명 "페이지를 떠나면 입력한 내용이 사라집니다. 정말 나가시겠어요?"
   - 버튼: "머무르기"(secondary, onCancel), "나가기"(danger variant, onConfirm)
   - hideCloseButton 적용하여 X 버튼 숨김

2. `src/hooks/useBeforeUnload.ts` 파일 생성
   - 파라미터: `enabled: boolean`
   - `useEffect`로 `beforeunload` 이벤트 리스너 등록/해제
   - 핸들러: `e.preventDefault(); e.returnValue = ''` 로 브라우저 기본 경고 트리거
   - enabled가 false면 리스너 등록하지 않음

### 1.3. Sidebar/BottomNav에 GuardedLink 적용

**Status:** pending  
**Dependencies:** 1.1, 1.2  

Sidebar와 BottomNav의 Link를 GuardedLink로 교체하여 dirty 상태일 때 이탈 경고 모달을 표시합니다.

**Details:**

1. `src/components/layout/sidebar.tsx` 수정
   - `GuardedLink` 내부 컴포넌트 추가
   - Props: `href`, `children`, 기타 Link props (className, aria-current 등)
   - `useDirtyForm()` 훅으로 `isDirty`, `setDirty` 조회
   - `useState`로 `confirmOpen` 관리
   - `onClick`: isDirty면 `e.preventDefault()` + `setConfirmOpen(true)`
   - `onConfirm`: `setDirty(false)` 후 `router.push(href)`
   - `onCancel`: `setConfirmOpen(false)`
   - `LeaveConfirmDialog` 렌더링
   - `NavRow` 내 `<Link>`를 `<GuardedLink>`로 교체 (서브메뉴 포함)
   - 하단 프로필 영역 Link도 GuardedLink로 교체

2. `src/components/layout/bottom-nav.tsx` 수정
   - 동일한 패턴으로 모바일 탭의 Link를 GuardedLink로 교체
   - `use client` 이미 선언되어 있으므로 훅 사용 가능

### 1.4. PracticeCreateWizard에 dirty 플래그 연동

**Status:** pending  
**Dependencies:** 1.1, 1.2, 1.3  

합주 생성 마법사에서 입력 상태에 따라 dirty 플래그를 설정하고, 제출 성공 시 초기화합니다.

**Details:**

1. `src/app/(main)/practices/new/PracticeCreateWizard.client.tsx` 수정
   - `useDirtyForm()` 훅 import 및 호출
   - `useBeforeUnload(isDirty)` 훅 호출로 브라우저 새로고침/뒤로가기 경고 활성화
   - dirty 판정 로직 (useEffect로 구현):
     - step > 0 이면 dirty
     - step === 0 이고 bandId가 선택되었으면 dirty
     - 그 외에는 not dirty
   - mutation onSuccess 콜백에서 `setDirty(false)` 호출 (라우트 이동 전)
   - 컴포넌트 unmount 시 cleanup으로 `setDirty(false)` (useEffect return)

2. dirty 로직 예시:
   ```tsx
   const { setDirty } = useDirtyForm();
   useEffect(() => {
     const hasDirtyData = step > 0 || !!bandId;
     setDirty(hasDirtyData);
   }, [step, bandId, setDirty]);
   useEffect(() => () => setDirty(false), [setDirty]);
   ```
