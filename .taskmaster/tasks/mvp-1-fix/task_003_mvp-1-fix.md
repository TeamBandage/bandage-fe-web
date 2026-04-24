# Task ID: 3

**Title:** (main) 레이아웃 개편 - Shell 기반 반응형 구조

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** src/app/(main)/layout.tsx를 Shell 기반으로 재작성하여 960px 이상에서는 Sidebar + 메인 영역, 미만에서는 기존 BottomNav + Container 구조가 동작하도록 한다.

**Details:**

1. src/app/(main)/layout.tsx 수정:
   ```tsx
   export default function MainLayout({ children }) {
     return (
       <>
         {/* Desktop: Shell + Sidebar */}
         <div className="hidden lg:flex h-screen w-screen overflow-hidden">
           <Shell>
             <Sidebar />
             <div className="flex-1 flex flex-col overflow-hidden">
               {children}
             </div>
           </Shell>
         </div>
         
         {/* Mobile: 기존 구조 */}
         <div className="lg:hidden min-h-screen pb-16">
           <Container>{children}</Container>
           <BottomNav />
         </div>
       </>
     );
   }
   ```

2. Sidebar 네비게이션 아이템 클릭 시 해당 라우트로 이동 연결
   - usePathname() 활용하여 active 상태 판별
   - ROUTES 상수 활용

3. Sidebar footer의 user 정보는 useAuthStore에서 가져오기

4. 기존 Container 컴포넌트의 padding을 토큰화:
   - 모바일: 16px
   - 태블릿(md): 20px

**Test Strategy:**

1. pnpm dev 실행 후 브라우저 창 크기 조절하여 960px 기준 레이아웃 전환 확인
2. 각 네비게이션 아이템 클릭 시 라우트 이동 및 active 상태 확인
3. 기존 모바일 레이아웃(BottomNav)이 정상 동작하는지 확인
4. Playwright E2E: 데스크톱/모바일 뷰포트에서 레이아웃 렌더링 테스트

## Subtasks

### 3.1. MainLayout 반응형 분기 구조 작성

**Status:** pending  
**Dependencies:** None  

src/app/(main)/layout.tsx를 수정하여 960px(lg) 기준으로 데스크톱/모바일 레이아웃이 분기되도록 구조를 작성한다.

**Details:**

layout.tsx 파일을 수정하여 lg:hidden / hidden lg:flex CSS 클래스 기반 분기 구조를 작성한다. 데스크톱 영역에는 Shell + Sidebar placeholder, 모바일 영역에는 기존 Container + BottomNav를 유지한다. Task 2에서 Shell/Sidebar 컴포넌트가 완성되면 import로 연결할 수 있도록 구조를 준비한다. 모바일 영역은 min-h-screen pb-16으로 기존 패딩 유지, 데스크톱은 h-screen w-screen overflow-hidden flex 구조로 작성한다.

### 3.2. Sidebar 네비게이션 연동 (usePathname + ROUTES)

**Status:** pending  
**Dependencies:** 3.1  

Sidebar 컴포넌트에서 usePathname 훅을 활용해 현재 경로를 판별하고, ROUTES 상수 기반으로 네비게이션 아이템을 렌더링한다.

**Details:**

Task 2에서 생성된 sidebar.tsx를 수정하여 다음을 구현한다: (1) usePathname()으로 현재 경로 가져오기 (2) ROUTES.HOME, ROUTES.BANDS, ROUTES.PRACTICES, ROUTES.PERFORMANCES, ROUTES.ME에 대응하는 네비게이션 아이템 배열 정의 (3) bottom-nav.tsx의 isActive 로직을 재사용하여 active 상태 판별 (4) active 아이템에 bg-accent-dim text-accent 스타일 적용 (5) Next.js Link 컴포넌트로 클릭 시 라우트 이동 연결

### 3.3. Sidebar footer 사용자 정보 연동 (useMe 훅)

**Status:** pending  
**Dependencies:** 3.2  

Sidebar footer 영역에 useMe 훅을 통해 현재 로그인한 사용자의 이름, 이메일을 표시하고 마이페이지 링크를 추가한다.

**Details:**

sidebar.tsx의 footer 영역을 수정하여 다음을 구현한다: (1) useMe() 훅으로 MemberInfoResponse(id, email, name) 가져오기 (2) Avatar 컴포넌트에 name 전달 (3) 사용자 이름과 이메일 표시 (text overflow ellipsis 처리) (4) footer 전체를 Link로 감싸서 ROUTES.ME로 이동 가능하게 연결 (5) 로딩 상태에서는 Skeleton UI 표시 (6) lg 미만에서는 user 정보 숨김 처리 유지

### 3.4. Container 컴포넌트 패딩 토큰화

**Status:** pending  
**Dependencies:** None  

기존 Container 컴포넌트의 padding을 디자인 토큰 기반으로 변경하여 모바일 16px, 태블릿(md) 20px 간격을 적용한다.

**Details:**

src/components/layout/container.tsx를 수정한다: (1) 기존 px-4를 px-4 md:px-5로 변경하여 반응형 패딩 적용 (모바일 16px = 1rem = px-4, 태블릿 20px = 1.25rem = px-5) (2) Tailwind v4에서 spacing scale이 올바르게 동작하는지 확인 (3) Task 1에서 추가되는 spacing 토큰(--s-4, --s-5)과 일관성 유지

### 3.5. 데스크톱/모바일 레이아웃 통합 테스트 및 Playwright E2E 추가

**Status:** pending  
**Dependencies:** 3.1, 3.2, 3.3, 3.4  

완성된 반응형 레이아웃이 960px 기준으로 올바르게 전환되는지 수동 테스트 후 Playwright E2E 테스트 케이스를 추가한다.

**Details:**

다음 항목을 검증한다: (1) 960px 이상에서 Sidebar가 보이고 BottomNav가 숨겨지는지 확인 (2) 960px 미만에서 BottomNav가 보이고 Sidebar가 숨겨지는지 확인 (3) Sidebar 네비게이션 클릭 시 라우트 이동 및 active 상태 갱신 확인 (4) 기존 모바일 레이아웃 기능이 정상 동작하는지 회귀 테스트 (5) e2e/layout.spec.ts 파일을 생성하여 viewport 1440x900과 375x812에서 레이아웃 요소 가시성 테스트 작성
