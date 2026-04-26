# Task ID: 8

**Title:** 잔존 결함 정리 (카피/시각/무한스크롤/멤버명)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** PRD Phase H에 명시된 잔존 결함들을 일괄 수정한다: 안내 카피 제거, 카드 선택 시각 강조, 무한 스크롤 검증, 멤버 이름 표시 분석, "(자작곡)" 라벨 제거.

**Details:**

## 구현 대상

### 8-1: 카피 제거
- `PracticeCreateWizard.client.tsx` line 118
- 삭제: `<p className="text-foreground-muted">밴드 → 곡 → 일정 순서로 진행합니다.</p>`

### 8-2: 무한 스크롤 검증
- 검증 대상: 밴드 목록, 합주 목록, 공연 목록, 멤버 목록, 가입 신청 목록
- 검증 방법:
  1. 백엔드 pageSize=2 설정 후 5개 이상 데이터 생성
  2. 스크롤 → IntersectionObserver 트리거 확인
  3. `fetchNextPage` 호출 → 다음 페이지 로드
- 결과: `.taskmaster/reports/infinite-scroll-verification-2026-04-26.md` 작성

### 8-3: 멤버 이름 표시 분석
- 현상: "멤버 #2718" 표시 (getMemberDisplayName 폴백)
- 분석:
  1. curl로 `/bands/{id}/members` 실제 응답 확인
  2. `BandMemberInfoResponse.name` 필드 존재 여부
  3. 빈 문자열인지 undefined인지 확인
- 조치:
  - 백엔드 미지원 → API_REQUIRED.md FE-API-012 업데이트
  - 빈 문자열 케이스 → `getMemberDisplayName` 로직 보강 (이미 `.trim()` 처리됨)

### 8-4: 카드 선택 시각 강조 일관화
- 대상: 합주곡 검색 카드, 밴드 그리드 카드, EntityPickerModal 결과 카드
- 적용 스타일 (선택 시):
  ```css
  border-l-2 border-accent bg-accent-dim
  /* 우상단 체크 아이콘 */
  <Check className="absolute top-2 right-2 h-4 w-4 text-accent" />
  ```
- 공통 컴포넌트화: `SelectableCard` wrapper 또는 유틸 클래스

### 8-5: "(자작곡)" 라벨 제거
- `PracticeCreateWizard.client.tsx` line 196
- 변경: `직접 입력 (자작곡)` → `직접 입력`

## 의사 코드
```tsx
// 8-4 SelectableCard
export function SelectableCard({ selected, children, ...props }) {
  return (
    <div className={cn(
      'relative border rounded-md p-s-3 transition-colors',
      selected && 'border-l-2 border-accent bg-accent-dim'
    )} {...props}>
      {selected && <Check className="absolute top-2 right-2 h-4 w-4 text-accent" />}
      {children}
    </div>
  );
}
```

**Test Strategy:**

### 8-1
- 마법사 헤더에 "밴드 → 곡 → 일정" 문구 없음 확인

### 8-2
- 무한 스크롤 검증 리포트 작성 완료
- 각 목록에서 스크롤 시 추가 데이터 로드 확인
- hasNext=false 시 fetchNextPage 미호출

### 8-3
- 멤버 탭에서 실제 이름 표시 or 폴백 규칙 동작 확인
- API 응답에 name 필드 포함 시 정상 표시

### 8-4
- 합주곡 검색 카드 선택 → 좌측 보더 + ✓ 아이콘 + 배경 변경
- 밴드 그리드 카드, EntityPickerModal 동일 동작

### 8-5
- 마법사 Step 2 탭에 "직접 입력"만 표시 ("자작곡" 없음)

## Subtasks

### 8.1. 안내 카피 제거 및 (자작곡) 라벨 수정

**Status:** pending  
**Dependencies:** None  

PracticeCreateWizard에서 불필요한 안내 카피를 삭제하고 직접 입력 탭의 라벨을 수정한다.

**Details:**

PracticeCreateWizard.client.tsx 파일에서 두 가지 수정을 수행한다. 첫째, line 118의 `<p className="text-foreground-muted text-caption">밴드 → 곡 → 일정 순서로 진행합니다.</p>` 요소를 삭제한다. 둘째, line 196의 `직접 입력 (자작곡)` 텍스트를 `직접 입력`으로 변경한다. 두 수정 모두 단순 문자열 변경이므로 별도의 로직 수정은 필요 없다.

### 8.2. SelectableCard 공통 컴포넌트 구현 및 카드 선택 시각 강조 일관화

**Status:** pending  
**Dependencies:** None  

선택 가능한 카드에 좌측 보더, 배경, 체크 아이콘을 적용하는 공통 컴포넌트를 만들고 마법사 및 EntityPickerModal에 적용한다.

**Details:**

src/components/ui/selectable-card.tsx에 SelectableCard 컴포넌트를 생성한다. Props: selected (boolean), children, 나머지 div 속성. 선택 시 스타일: `border-l-2 border-accent bg-accent-dim`, 우상단에 Check 아이콘(lucide-react) 표시. 기존 listItemClasses 유틸(src/lib/list-item-styles.ts)의 패턴을 참고하되 좌측 보더와 체크 아이콘을 추가한다. 적용 대상: PracticeCreateWizard의 밴드 카드(line 137-163), 곡 검색 카드(line 223-244), BandPickerModal의 renderItem(line 51-68), EntityPickerModal 내부 버튼 래퍼. 기존 인라인 스타일을 SelectableCard로 교체한다.

### 8.3. 무한 스크롤 검증 및 리포트 작성

**Status:** pending  
**Dependencies:** None  

밴드/합주/공연/멤버/가입 신청 목록의 무한 스크롤 동작을 백엔드와 함께 검증하고 리포트를 작성한다.

**Details:**

검증 대상 파일: BandsList.client.tsx(밴드), PracticesList.client.tsx(합주), PerformancesList.client.tsx(공연), BandDetailContent.client.tsx 내 MembersTab(멤버)/ApplicationsTab(가입 신청). 검증 방법: (1) 백엔드 pageSize=2로 설정 후 각 목록에 5개 이상 데이터 생성. (2) 화면 스크롤 → IntersectionObserver 트리거 확인. (3) fetchNextPage 호출 → 다음 페이지 로드 확인. (4) hasNext=false일 때 fetchNextPage 미호출 확인. 멤버/신청 목록은 IntersectionObserver 대신 '더 불러오기' 버튼 방식이므로 버튼 클릭 동작도 검증. 결과를 .taskmaster/reports/infinite-scroll-verification-2026-04-26.md에 작성하며, 각 목록별 판정(정상/이슈)과 스크린샷 또는 네트워크 로그를 포함한다.

### 8.4. 멤버 이름 표시 분석 및 getMemberDisplayName 보강

**Status:** pending  
**Dependencies:** None  

멤버 #2718 폴백 표시 현상의 원인을 분석하고 필요 시 getMemberDisplayName 로직을 보강하거나 API 요청 문서를 업데이트한다.

**Details:**

분석 단계: (1) curl로 /api/v1/bands/{id}/members 실제 응답 확인. (2) BandMemberInfoResponse에 name 필드 존재 여부 및 값 확인(null, undefined, 빈 문자열 구분). (3) getMemberDisplayName.ts(src/domain/member/utils/) 로직 검토 - 현재 .trim() 처리는 되어 있으나 빈 문자열 케이스 추가 확인. 조치: 백엔드가 name을 응답하지 않는 경우 API_REQUIRED.md의 FE-API-012 항목 업데이트. 백엔드가 빈 문자열을 반환하는 경우 getMemberDisplayName에서 이미 처리되므로 추가 조치 불필요. 분석 결과와 조치 내용을 .taskmaster/reports/infinite-scroll-verification-2026-04-26.md의 멤버 이름 섹션에 추가로 기록한다.
