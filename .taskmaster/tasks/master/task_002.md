# Task ID: 2

**Title:** Tailwind CSS v4 디자인 토큰 및 globals.css 설정

**Status:** done

**Dependencies:** 1 ✓

**Priority:** high

**Description:** /design/dist/css/tokens.css의 디자인 토큰을 Tailwind v4 @theme 문법으로 이식하고, 다크 테마 기반의 시맨틱 토큰 시스템을 구축합니다.

**Details:**

1. src/app/globals.css에 Tailwind v4 @theme 블록 작성:
```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-bg: #0D0D12;
  --color-surface: #161620;
  --color-card: #1E1E2A;
  --color-card-hover: #252535;
  --color-border: #2A2A3A;
  --color-border-hi: #35354A;
  
  /* Text */
  --color-foreground: #F4F4F8;
  --color-foreground-sub: #B4B4C4;
  --color-foreground-muted: #6B6B80;
  
  /* Accent - Blue */
  --color-accent: oklch(0.62 0.22 250);
  --color-accent-dim: oklch(0.62 0.22 250 / 0.14);
  --color-accent-soft: oklch(0.62 0.22 250 / 0.08);
  --color-accent-hi: oklch(0.72 0.20 250);
  
  /* Semantic */
  --color-success: oklch(0.70 0.18 155);
  --color-success-dim: oklch(0.70 0.18 155 / 0.15);
  --color-warn: oklch(0.76 0.17 85);
  --color-warn-dim: oklch(0.76 0.17 85 / 0.15);
  --color-danger: oklch(0.65 0.23 25);
  --color-danger-dim: oklch(0.65 0.23 25 / 0.15);
  
  /* Role colors */
  --color-role-leader: oklch(0.72 0.18 48);
  --color-role-admin: oklch(0.62 0.22 250);
  --color-role-member: #6B6B80;
  
  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-pill: 999px;
  
  /* Spacing - Tailwind 기본 스케일 확장 */
  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.25);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.45);
  
  /* Motion */
  --ease-default: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  
  /* Font */
  --font-sans: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

2. html에 dark 클래스 기본 적용 설정 (src/app/layout.tsx)

3. 베이스 리셋 스타일 추가 (body bg-bg text-foreground 등)

**Test Strategy:**

/playground 페이지에서 각 토큰 색상이 올바르게 렌더링되는지 시각적으로 확인, Tailwind 클래스(bg-surface, text-foreground 등) 적용 테스트

## Subtasks

### 2.1. globals.css에 Tailwind v4 @theme 블록 작성

**Status:** pending  
**Dependencies:** None  

design/dist/css/tokens.css의 디자인 토큰을 Tailwind v4 @theme 문법으로 변환하여 src/app/globals.css에 작성합니다.

**Details:**

src/app/globals.css 파일을 생성/수정하여 Tailwind v4 @theme 블록을 작성합니다.

1. 파일 상단에 `@import "tailwindcss";` 추가
2. `@theme` 블록 내에 다음 토큰들을 정의:
   - Surfaces: --color-bg, --color-surface, --color-card, --color-card-hover, --color-border, --color-border-hi
   - Text: --color-foreground, --color-foreground-sub, --color-foreground-muted
   - Accent(Blue): --color-accent, --color-accent-dim, --color-accent-soft, --color-accent-hi (oklch 컬러 사용)
   - Semantic: --color-success, --color-success-dim, --color-warn, --color-warn-dim, --color-danger, --color-danger-dim
   - Role colors: --color-role-leader, --color-role-admin, --color-role-member
   - Radii: --radius-sm(6px), --radius-md(10px), --radius-lg(14px), --radius-xl(20px), --radius-pill(999px)
   - Shadow: --shadow-sm, --shadow-md, --shadow-lg
   - Motion: --ease-default, --duration-fast(120ms), --duration-normal(200ms)
   - Font: --font-sans (Noto Sans KR 기반)

원본 tokens.css에서 변수명을 Tailwind 컨벤션에 맞게 변환합니다 (예: --text → --color-foreground).

### 2.2. layout.tsx에 dark 클래스 기본 적용 설정

**Status:** pending  
**Dependencies:** 2.1  

src/app/layout.tsx의 html 태그에 dark 클래스를 기본 적용하여 다크 테마를 활성화합니다.

**Details:**

src/app/layout.tsx 파일을 수정하여 다크 테마를 기본으로 적용합니다.

1. `<html>` 태그에 `className="dark"` 추가
2. `lang="ko"` 속성 확인/추가 (한국어 서비스)
3. Noto Sans KR 폰트 로드 설정:
   - next/font/google에서 Noto_Sans_KR import
   - font 객체 생성하여 subsets, weight 설정
   - body 또는 html에 font.className 적용

```tsx
import { Noto_Sans_KR } from 'next/font/google';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`dark ${notoSansKr.className}`}>
      ...
    </html>
  );
}
```

### 2.3. 베이스 리셋 및 body 스타일 추가

**Status:** pending  
**Dependencies:** 2.1  

globals.css에 기본 리셋 스타일과 body에 bg-bg, text-foreground 등 베이스 스타일을 적용합니다.

**Details:**

design/dist/css/base.css를 참조하여 globals.css에 베이스 스타일을 추가합니다.

1. @theme 블록 이후에 베이스 레이어 스타일 추가:
   ```css
   @layer base {
     *, *::before, *::after {
       box-sizing: border-box;
       margin: 0;
       padding: 0;
     }
     
     html {
       -webkit-font-smoothing: antialiased;
       -moz-osx-font-smoothing: grayscale;
       text-rendering: optimizeLegibility;
     }
     
     body {
       @apply bg-bg text-foreground;
       line-height: 1.5;
     }
     
     /* 스크롤바 스타일 */
     ::-webkit-scrollbar { width: 6px; height: 6px; }
     ::-webkit-scrollbar-track { background: transparent; }
     ::-webkit-scrollbar-thumb { @apply bg-border rounded-sm; }
     ::-webkit-scrollbar-thumb:hover { @apply bg-border-hi; }
     
     /* 텍스트 선택 스타일 */
     ::selection { background: oklch(0.62 0.22 250 / 0.3); }
   }
   ```

2. 입력 요소 기본 스타일 리셋
3. 링크 기본 스타일 (accent 색상)

### 2.4. 커스텀 애니메이션 및 유틸리티 클래스 추가

**Status:** pending  
**Dependencies:** 2.3  

globals.css에 프로젝트에서 사용할 커스텀 애니메이션(fade-in, modal-in, toast-in, shimmer 등)과 sr-only 등 유틸리티 클래스를 추가합니다.

**Details:**

design/dist/css/base.css의 애니메이션을 참조하여 커스텀 애니메이션과 유틸리티를 추가합니다.

1. @keyframes 정의:
   ```css
   @keyframes spin {
     from { transform: rotate(0deg); }
     to { transform: rotate(360deg); }
   }
   @keyframes fade-in {
     from { opacity: 0; transform: translateY(6px); }
     to { opacity: 1; transform: translateY(0); }
   }
   @keyframes modal-in {
     from { opacity: 0; transform: scale(0.96); }
     to { opacity: 1; transform: scale(1); }
   }
   @keyframes toast-in {
     from { opacity: 0; transform: translateX(-50%) translateY(20px); }
     to { opacity: 1; transform: translateX(-50%) translateY(0); }
   }
   @keyframes shimmer {
     0% { background-position: -400px 0; }
     100% { background-position: 400px 0; }
   }
   ```

2. 유틸리티 클래스:
   - .sr-only (스크린 리더 전용)
   - .animate-fade-in, .animate-modal-in 등

3. @theme에 animation 관련 토큰 추가 (선택적)

### 2.5. playground 페이지에서 디자인 토큰 검증

**Status:** pending  
**Dependencies:** 2.4  

src/app/playground/page.tsx를 생성하여 모든 디자인 토큰(색상, 반지름, 그림자 등)이 올바르게 렌더링되는지 시각적으로 확인할 수 있는 테스트 페이지를 구현합니다.

**Details:**

디자인 토큰이 올바르게 적용되는지 확인하기 위한 playground 페이지를 생성합니다.

1. src/app/playground/page.tsx 생성:
   ```tsx
   export default function PlaygroundPage() {
     return (
       <div className="p-6 space-y-8">
         <section>
           <h2 className="text-xl font-bold mb-4 text-foreground">Surfaces</h2>
           <div className="flex gap-4">
             <div className="w-24 h-24 bg-bg rounded-md" title="bg-bg" />
             <div className="w-24 h-24 bg-surface rounded-md" title="bg-surface" />
             <div className="w-24 h-24 bg-card rounded-md" title="bg-card" />
             <!-- ... -->
           </div>
         </section>
         <section>
           <h2 className="text-xl font-bold mb-4">Text Colors</h2>
           <p className="text-foreground">text-foreground</p>
           <p className="text-foreground-sub">text-foreground-sub</p>
           <p className="text-foreground-muted">text-foreground-muted</p>
         </section>
         <!-- Accent, Semantic, Role, Radius, Shadow 섹션 추가 -->
       </div>
     );
   }
   ```

2. 각 토큰 카테고리별 시각적 샘플 렌더링
3. 애니메이션 데모 섹션 추가
4. pnpm dev 후 /playground 접속하여 모든 토큰 확인
