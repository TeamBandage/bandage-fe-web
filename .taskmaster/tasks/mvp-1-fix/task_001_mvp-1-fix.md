# Task ID: 1

**Title:** 디자인 토큰 재이식 및 글로벌 CSS 확장

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** src/app/globals.css의 @theme에 누락된 디자인 토큰(Spacing scale, Layout 변수, Typography scale, Breakpoint override, Auth gradient)을 design/dist/css/tokens.css 기반으로 전부 반영한다.

**Details:**

1. globals.css의 @theme 섹션에 다음 토큰들을 추가:
   - Spacing scale: --spacing-s-1(4px) ~ --spacing-s-12(48px)
   - Layout: --sidebar-w(240px), --list-pane-w(340px), --band-list-pane-w(360px)
   - Typography: --text-display(40px), --text-title-lg(26px), --text-title(20px), --text-subtitle(18px), --text-body(14px), --text-caption(13px), --text-micro(11px)
   - Breakpoint override: --breakpoint-sm(480px), --breakpoint-md(768px), --breakpoint-lg(960px), --breakpoint-xl(1280px)
   - Auth gradient: --gradient-auth-brand: linear-gradient(145deg, #0D0D1E 0%, #111128 100%)
   - Amber 색상 추가: --color-amber, --color-amber-dim

2. Tailwind v4에서 커스텀 브레이크포인트 960px를 lg로 오버라이드:
   ```css
   @theme {
     --breakpoint-lg: 960px;
   }
   ```

3. /playground 페이지에 토큰 매트릭스 섹션 추가:
   - src/app/playground/page.tsx 생성
   - 모든 색상, 간격, 타이포그래피 토큰을 시각적으로 렌더링

**Test Strategy:**

1. pnpm dev 실행 후 /playground 페이지에서 모든 토큰이 올바르게 렌더링되는지 시각 확인
2. Tailwind 클래스(lg:, bg-amber 등)가 960px 기준으로 작동하는지 브라우저 DevTools에서 확인
3. 기존 페이지들이 스타일 깨짐 없이 렌더링되는지 회귀 테스트

## Subtasks

### 1.1. Spacing scale 및 Layout 변수 토큰 추가

**Status:** done  
**Dependencies:** None  

globals.css의 @theme 섹션에 Spacing scale(--spacing-s-1 ~ --spacing-s-12)과 Layout 변수(--sidebar-w, --list-pane-w, --band-list-pane-w)를 design/dist/css/tokens.css 기반으로 추가한다.

**Details:**

globals.css의 @theme 블록 내에 다음 토큰들을 추가:

1. Spacing scale (design/dist/css/tokens.css의 --s-* 매핑):
   - --spacing-s-1: 4px
   - --spacing-s-2: 8px
   - --spacing-s-3: 12px
   - --spacing-s-4: 16px
   - --spacing-s-5: 20px
   - --spacing-s-6: 24px
   - --spacing-s-8: 32px
   - --spacing-s-10: 40px
   - --spacing-s-12: 48px

2. Layout 변수 (Shell 컴포넌트에서 사용):
   - --sidebar-w: 240px (사이드바 고정 너비)
   - --list-pane-w: 340px (마스터-디테일 목록 패널)
   - --band-list-pane-w: 360px (밴드 목록 패널, 넓은 버전)

Tailwind v4에서 --spacing-s-* 는 spacing() 함수나 s-1, s-2 같은 클래스로 자동 노출됨.

### 1.2. Typography scale 토큰 추가

**Status:** done  
**Dependencies:** 1.1  

globals.css의 @theme 섹션에 Typography scale 토큰(--text-display, --text-title-lg, --text-title, --text-subtitle, --text-body, --text-caption, --text-micro)을 추가한다.

**Details:**

globals.css의 @theme 블록 내에 다음 Typography 토큰들을 추가:

- --text-display: 40px (Auth 브랜드 타이틀용)
- --text-title-lg: 26px (페이지 대제목, Auth form title)
- --text-title: 20px (섹션 제목, Sidebar title)
- --text-subtitle: 18px (Topbar title)
- --text-body: 14px (본문 기본)
- --text-caption: 13px (보조 텍스트, 메타 정보)
- --text-micro: 11px (라벨, 힌트, 매우 작은 텍스트)

Tailwind v4에서 text-display, text-title-lg 같은 클래스로 사용 가능하도록 네이밍.
기존 playground Typography 섹션은 font-sans만 표시하므로 새 토큰 시각화는 subtask 5에서 처리.

### 1.3. Breakpoint override 및 Auth gradient 토큰 추가

**Status:** done  
**Dependencies:** 1.1  

Tailwind v4의 breakpoint를 960px 기준 lg로 오버라이드하고, Auth gradient 및 Amber 색상 토큰을 globals.css @theme에 추가한다.

**Details:**

@theme 블록 내에 다음 토큰들을 추가:

1. Breakpoint override (Tailwind v4 커스텀 브레이크포인트):
   - --breakpoint-sm: 480px
   - --breakpoint-md: 768px
   - --breakpoint-lg: 960px (디자인 명세 기준, 기본 1024px에서 변경)
   - --breakpoint-xl: 1280px

2. Auth gradient:
   - --gradient-auth-brand: linear-gradient(145deg, #0D0D1E 0%, #111128 100%)
   (design/dist/css/layout.css의 .auth-brand 배경과 일치)

3. Amber 색상 (design/dist/css/tokens.css 참조):
   - --color-amber: oklch(0.72 0.18 48)
   - --color-amber-dim: oklch(0.72 0.18 48 / 0.15)

Breakpoint 오버라이드로 lg: 클래스가 960px 기준으로 동작하게 됨.

### 1.4. 기존 페이지 스타일 회귀 테스트 및 토큰 충돌 검증

**Status:** done  
**Dependencies:** 1.1, 1.2, 1.3  

새로 추가된 토큰들이 기존 페이지들과 충돌하지 않는지 검증하고, 필요 시 기존 토큰 네이밍과 조정한다.

**Details:**

새 토큰 추가 후 기존 코드베이스와의 호환성을 검증:

1. 네이밍 충돌 검사:
   - 기존 --color-* 토큰과 새 --color-amber* 충돌 없음 확인
   - 기존 text-* 클래스(text-foreground 등)와 새 typography 토큰 충돌 검사
   - Tailwind의 기본 spacing scale과 새 --spacing-s-* 병존 확인

2. 회귀 테스트 대상 페이지:
   - /login, /signup (Auth 관련)
   - /home (홈 대시보드)
   - /bands, /bands/[id] (밴드 목록/상세)
   - /practices (합주 목록)
   - /me (마이페이지)

3. 확인 사항:
   - 레이아웃 깨짐 없음
   - 색상/간격/타이포가 기존과 동일
   - 반응형 동작 유지

4. 필요 시 토큰명 조정 (예: --text-* 충돌 시 --font-size-* 로 변경 검토)

### 1.5. Playground 페이지에 토큰 매트릭스 섹션 확장

**Status:** done  
**Dependencies:** 1.4  

src/app/playground/page.tsx에 새로 추가된 토큰들(Spacing, Typography, Breakpoint, Amber, Gradient)을 시각적으로 렌더링하는 섹션을 추가한다.

**Details:**

기존 playground 페이지(src/app/playground/page.tsx)에 다음 섹션들을 추가:

1. Spacing Scale 섹션:
   - s-1 ~ s-12 각 간격을 박스 너비/높이로 시각화
   - 각 박스에 토큰명과 px 값 라벨 표시

2. Typography Scale 섹션:
   - display, title-lg, title, subtitle, body, caption, micro 각 크기로 샘플 텍스트 렌더링
   - 토큰명과 px 값 표시

3. Layout 변수 섹션:
   - sidebar-w, list-pane-w, band-list-pane-w 너비를 시각적 막대로 표현

4. Breakpoint 섹션:
   - 각 브레이크포인트(sm/md/lg/xl) 값과 현재 뷰포트 너비 대비 활성 상태 표시

5. Amber 색상 + Gradient 섹션:
   - semanticSwatches 배열에 amber/amber-dim 추가
   - Auth gradient 시각화 (gradient 박스)

기존 Section, SwatchGrid 컴포넌트 재사용.
