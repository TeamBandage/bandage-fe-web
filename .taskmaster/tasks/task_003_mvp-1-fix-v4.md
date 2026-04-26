# Task ID: 3

**Title:** 탐색 카드 '내 항목' 시인성 강화

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** 밴드/공연 탐색 탭의 카드에서 사용자가 이미 소속된 항목을 시각적으로 강조하여 구분한다.

**Details:**

## 구현 대상

1. **MyItemMarker 컴포넌트** (`src/components/ui/my-item-marker.tsx`)
   - Props: `type: 'band' | 'performance'`
   - 렌더링: 작은 칩 (accent-soft 배경 + accent 글자)
   - 카피: `내 밴드` / `내 공연`
   ```tsx
   export function MyItemMarker({ type }: { type: 'band' | 'performance' }) {
     const label = type === 'band' ? '내 밴드' : '내 공연';
     return (
       <span className="bg-accent-soft text-accent text-micro font-semibold px-s-2 py-0.5 rounded">
         {label}
       </span>
     );
   }
   ```

2. **BandsListPane 수정** (`src/app/(main)/bands/BandsListPane.client.tsx`)
   - 탐색 탭 `BandRow` 에서 `myRole` 이 존재하면:
     - 좌상단에 `<MyItemMarker type="band" />` 표시
     - 카드 좌측에 2px accent 보더 추가: `border-l-2 border-accent`
   - 기존 `BandRoleBadge`는 별도로 유지 (역할 표시)

3. **PerformancesListPane 수정** (`src/app/(main)/performances/PerformancesListPane.client.tsx`)
   - 현재 `useMyPerformances` 결과를 Set으로 변환하여 performanceId 매칭
   - 탐색 탭에서 내 공연인 경우 동일 시각 처리

4. **listItemClasses 확장** (`src/lib/list-item-styles.ts`)
   - `isMine` 파라미터 추가하여 좌측 보더 조건부 적용

## 시각 단서 조합 (PRD default)
- (i) 우상단 "내 밴드/내 공연" 칩
- (ii) 좌측 2px accent 보더
- 모바일에서는 칩만 표시 (보더는 시각 노이즈 — `lg:border-l-2` 조건)

## 의사 코드
```tsx
// BandRow 수정
const isMine = !!myRole;
return (
  <Link className={cn(listItemClasses(active, tone), isMine && 'lg:border-l-2 lg:border-accent')}>
    <div className="relative">
      {isMine && <MyItemMarker type="band" className="absolute -top-1 -right-1" />}
      {/* 기존 내용 */}
    </div>
  </Link>
);
```

**Test Strategy:**

1. 밴드 탐색 탭에서 소속 밴드 카드 → 좌측 보더 + 칩 노출
2. 비소속 밴드 카드 → 시각 강조 없음
3. 공연 탐색 탭 동일 동작
4. 모바일 뷰포트(<960px)에서 칩만 표시, 보더 미적용
5. 「내 밴드」탭 에서는 중복 표시 제거 (이미 전부 내 밴드)
6. 스크린리더 접근성: 칩에 적절한 aria-label

## Subtasks

### 3.1. MyItemMarker 컴포넌트 생성

**Status:** pending  
**Dependencies:** None  

밴드/공연 탐색 탭에서 사용자 소속 항목임을 표시하는 칩 형태의 마커 컴포넌트를 구현한다.

**Details:**

src/components/ui/my-item-marker.tsx 파일 생성. Props로 type: 'band' | 'performance' 받음. 기존 Badge 컴포넌트(src/components/ui/badge.tsx)의 accent variant 스타일(bg-accent-dim text-accent-hi)을 참고하여 구현. 렌더링: type에 따라 '내 밴드' 또는 '내 공연' 라벨 표시. 스타일: bg-accent-soft(globals.css에 정의된 oklch(0.62 0.22 250 / 0.08)) + text-accent + text-micro(11px) + font-semibold + px-s-2 py-0.5 rounded. 스크린리더 접근성을 위해 aria-label 추가 (예: '현재 소속 중').

### 3.2. listItemClasses 유틸 isMine 파라미터 확장

**Status:** pending  
**Dependencies:** 3.1  

리스트 아이템 스타일 유틸 함수에 내 항목 여부를 나타내는 파라미터를 추가하여 좌측 보더 조건부 적용을 지원한다.

**Details:**

src/lib/list-item-styles.ts 파일 수정. listItemClasses 함수 시그니처에 isMine?: boolean 파라미터 추가. PRD 요구사항에 따라 모바일에서는 보더 미표시, lg(960px) 이상에서만 좌측 2px accent 보더 표시: isMine이 true일 때 'lg:border-l-2 lg:border-accent' 클래스 추가. cn 유틸로 기존 클래스와 병합. 기존 호출부에 영향 없도록 기본값 false 설정.

### 3.3. BandsListPane 탐색 탭 내 항목 시각 강조 적용

**Status:** pending  
**Dependencies:** 3.1, 3.2  

밴드 탐색 탭의 BandRow 컴포넌트에서 사용자 소속 밴드를 MyItemMarker와 좌측 보더로 시각적으로 강조한다.

**Details:**

src/app/(main)/bands/BandsListPane.client.tsx 파일 수정. BandRow 컴포넌트에 isMine 변수 추가: const isMine = !!myRole. listItemClasses 호출 시 isMine 파라미터 전달. MyItemMarker 임포트 후, isMine이 true인 경우 카드 우상단에 <MyItemMarker type="band" /> 표시. 마커 위치: 기존 콘텐츠 div를 relative로 감싸고 MyItemMarker를 absolute -top-1 -right-1로 배치. 중요: '내 밴드' 탭에서는 모든 항목이 이미 내 밴드이므로 MyItemMarker 미표시 (중복 방지). discover 탭에서만 isMine 시각 강조 적용.

### 3.4. PerformancesListPane 탐색 탭 내 항목 시각 강조 적용

**Status:** pending  
**Dependencies:** 3.1, 3.2  

공연 탐색 탭의 PerformanceRow 컴포넌트에서 사용자 소속 공연을 MyItemMarker와 좌측 보더로 시각적으로 강조한다.

**Details:**

src/app/(main)/performances/PerformancesListPane.client.tsx 파일 수정. useMyPerformances 결과에서 performanceId Set 생성하여 O(1) 조회 지원: const myPerformanceIds = useMemo(() => new Set(all.map(p => p.performanceId)), [all]). PerformanceRow에 isMine prop 추가. listItemClasses 호출 시 isMine 파라미터 전달. MyItemMarker 임포트 후, isMine이 true인 경우 카드 우상단에 <MyItemMarker type="performance" /> 표시. discover 탭에서 렌더링 시 myPerformanceIds.has(p.performanceId)로 내 공연 여부 판정. 참고: 현재 PerformanceListItemResponse에는 myRole 같은 필드가 없어 별도 myPerformanceIds Set 매칭 필요. '내 공연' 탭에서는 MyItemMarker 미표시 (중복 방지).
