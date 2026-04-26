# Task ID: 1

**Title:** 레이아웃 비율 축소 — CSS 토큰 및 컴포넌트 슬림화

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 사이드바와 마스터 패널 너비를 줄여 MBA 13(1280px) 기준 화면의 38% 이하로 축소하고, 폰트 및 패딩 사이즈를 비례 조정한다.

**Details:**

## 구현 상세

### 1. globals.css 토큰 수정
```css
/* src/app/globals.css @theme 블록 내 */
--sidebar-w: 200px;      /* 240px → 200px */
--list-pane-w: 280px;    /* 340px → 280px */
--band-list-pane-w: 280px; /* 360px → 280px */
```
합계: 200 + 280 = 480px (1280px 대비 37.5%, 1440px 대비 33.3%)

### 2. sidebar.tsx 슬림화
- 로고 타일: `h-10 w-10` → `h-8 w-8`, 아이콘 `h-[22px]` → `h-[18px]`
- 'Bandage' 텍스트: `text-title` → `text-body font-black`
- Navigation 레이블: `text-micro` 유지
- NavRow 링크/버튼:
  - `py-s-3` → `py-s-2`
  - `px-s-4` → `px-s-3`
  - `text-body` → `text-caption`
  - 아이콘 `h-[18px]` → `h-4 w-4`
- 서브 메뉴: `ml-s-6` → `ml-s-5`, `py-s-2` → `py-1.5`
- 하단 프로필: 아바타 `md` → `sm`, 텍스트 그대로

### 3. ListPane 컴포넌트 슬림화
- `BandsListPane.client.tsx`:
  - 헤더 `text-subtitle` → `text-body font-bold`
  - 카드 row: `p-s-3` → `p-s-2`, `text-body` → `text-caption`
- `PracticesListPane.client.tsx`: 동일 패턴 적용
- `PerformancesListPane.client.tsx`: 동일 패턴 적용

### 4. 영향받지 않는 영역
- `<main>` 본문 가로 패딩 유지
- IconTile 'sm' 사이즈 유지
- 모바일(<960px) 전혀 영향 없음 (BottomNav 사용)

**Test Strategy:**

1. 브라우저 DevTools에서 1280px 너비 시뮬레이션 → 사이드바+마스터 영역이 480px(약 37.5%) 이하인지 측정
2. 1440px 너비에서 33.3% 이하 확인
3. 모바일(360px) 뷰포트에서 사이드바 미표시, BottomNav 정상 동작
4. 텍스트 잘림 없이 가독성 유지 확인

## Subtasks

### 1.1. globals.css 레이아웃 너비 토큰 수정

**Status:** pending  
**Dependencies:** None  

사이드바와 리스트 패널 너비 CSS 변수를 축소하여 MBA 13(1280px) 기준 38% 이하로 조정한다.

**Details:**

src/app/globals.css 파일의 @theme 블록(59-61번 라인)에서 다음 토큰을 수정한다:
- `--sidebar-w: 240px` → `--sidebar-w: 200px` (40px 감소)
- `--list-pane-w: 340px` → `--list-pane-w: 280px` (60px 감소)
- `--band-list-pane-w: 360px` → `--band-list-pane-w: 280px` (80px 감소)

변경 후 합계: 200 + 280 = 480px (1280px 대비 37.5%, 1440px 대비 33.3%).

이 토큰들은 sidebar.tsx(style={{ width: 'var(--sidebar-w)' }}), BandsListPane(var(--band-list-pane-w)), PracticesListPane/PerformancesListPane(var(--list-pane-w))에서 직접 참조되므로 토큰 수정만으로 전역 반영된다.

### 1.2. sidebar.tsx 컴포넌트 슬림화

**Status:** pending  
**Dependencies:** 1.1  

사이드바 내부 요소(로고, 네비게이션, 프로필)의 폰트 크기와 패딩을 비례 축소한다.

**Details:**

src/components/layout/sidebar.tsx 파일에서 다음 요소들을 수정한다:

1. 로고 영역(93-102번 라인):
   - 로고 타일: `h-10 w-10` → `h-8 w-8`
   - Guitar 아이콘: `h-[22px] w-[22px]` → `h-[18px] w-[18px]`
   - 'Bandage' 텍스트: `text-title` → `text-body font-black`

2. NavRow 링크/버튼(163-164, 183-184번 라인):
   - 패딩: `px-s-4 py-s-3` → `px-s-3 py-s-2`
   - 폰트: `text-body` → `text-caption`
   - 아이콘: `h-[18px] w-[18px]`는 유지 (이미 적절한 크기)

3. 서브 메뉴(199번 라인):
   - 왼쪽 마진: `ml-s-6` → `ml-s-5`
   - 서브 아이템: `py-s-2` → `py-1.5`

4. 하단 프로필(131번 라인):
   - Avatar: `size="md"` → `size="sm"`
   - 텍스트 크기는 현재 text-caption/text-micro로 유지

### 1.3. ListPane 컴포넌트 헤더 슬림화

**Status:** pending  
**Dependencies:** 1.1  

BandsListPane, PracticesListPane, PerformancesListPane의 헤더 영역 폰트와 패딩을 축소한다.

**Details:**

세 개의 ListPane 컴포넌트 파일에서 동일한 패턴으로 헤더 영역을 수정한다:

1. src/app/(main)/bands/BandsListPane.client.tsx (106-107번 라인):
   - 헤더 컨테이너: `px-s-5 py-s-4` → `px-s-4 py-s-3`
   - 제목 h2: `text-subtitle font-bold` → `text-body font-bold`

2. src/app/(main)/practices/PracticesListPane.client.tsx (83-84번 라인):
   - 헤더 컨테이너: `px-s-5 py-s-4` → `px-s-4 py-s-3`
   - 제목 h2: `text-subtitle font-bold` → `text-body font-bold`

3. src/app/(main)/performances/PerformancesListPane.client.tsx (77-78번 라인):
   - 헤더 컨테이너: `px-s-5 py-s-4` → `px-s-4 py-s-3`
   - 제목 h2: `text-subtitle font-bold` → `text-body font-bold`

버튼(밴드 만들기, 합주 시작하기, 공연 생성)은 size="sm" 유지.

### 1.4. ListPane 컴포넌트 목록 항목 슬림화

**Status:** pending  
**Dependencies:** 1.1, 1.3  

BandsListPane, PracticesListPane, PerformancesListPane의 목록 row 패딩과 폰트를 축소한다.

**Details:**

목록 항목 스타일을 수정한다:

1. src/lib/list-item-styles.ts (4번 라인):
   - BASE 상수에서 `p-s-3` → `p-s-2`로 변경
   - 이 변경으로 BandRow, PracticeRow, PerformanceRow 모두 일괄 적용됨

2. 각 ListPane 내 Row 컴포넌트 텍스트 크기:
   - BandsListPane.client.tsx BandRow (58번 라인): `text-body` → `text-caption`
   - PracticesListPane.client.tsx PracticeRow (44번 라인): `text-body` → `text-caption`
   - PerformancesListPane.client.tsx PerformanceRow (41번 라인): `text-body` → `text-caption`

주의: IconTile size="sm"은 유지하여 아이콘 크기는 그대로 둔다. 보조 텍스트(description, venue, startAt 등)는 이미 text-caption이므로 변경 불필요.
