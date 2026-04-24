# Task ID: 10

**Title:** 온보딩(랜딩) 페이지 구현

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** 비인증 사용자가 서비스를 처음 만났을 때 보는 /onboarding 랜딩 페이지를 /design 의 AuthBrand(gradient/rings/feature chips)와 홈의 인사말 구조를 조합해 구현하고, 미들웨어의 비인증 리다이렉트 타깃을 /login 에서 /onboarding 으로 전환한다.

**Details:**

1) src/app/onboarding/page.tsx 신규 작성 (Server Component, 로그인 이미 돼있으면 /home 리다이렉트).\n2) Hero 섹션: --gradient-auth-brand 배경 + 3 decorative rings + 72px 로고 + Bandage 타이틀(text-display) + tagline.\n3) Features 섹션: Home 기준 3대 축(합주 일정 관리 / 세션 편성 / 공연 연결) 각각 아이콘 + title + 1-2줄 설명.\n4) CTA: [시작하기] → /join, [이미 계정이 있어요] → /login (primary / ghost 변형).\n5) 모바일: 단일 column 스택 / 데스크톱: Hero + Features 2열 가운데 정렬. max-w 중앙 정렬.\n6) middleware.ts: 기존 /login 으로 보내던 비인증 루트(/) 접근을 /onboarding 으로 변경. /login, /join 등은 그대로 유지.\n7) /onboarding 은 인증 가드 없음 (public). 인증된 사용자가 접근 시 /home 으로 리다이렉트.\n8) 접근성: 랜드마크, heading 레벨, CTA 포커스 링.\n9) Playwright E2E: 비인증 / 접근시 /onboarding 으로 이동 확인, CTA 클릭 시 /login · /join 이동 확인.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 10.1. ROUTES 상수에 ONBOARDING 추가 및 기본 라우트 구조 생성

**Status:** pending  
**Dependencies:** None  

온보딩 페이지를 위한 라우트 상수를 추가하고 기본 페이지 파일 구조를 생성합니다.

**Details:**

1. src/global/config/routes.ts에 ONBOARDING: '/onboarding' 상수 추가 (LOGIN 위에 배치)
2. src/app/onboarding/page.tsx 신규 생성 - Server Component로 작성
3. 인증된 사용자 접근 시 /home으로 리다이렉트하는 로직 구현 (cookies().get('refreshToken') 체크 후 redirect(ROUTES.HOME))
4. 기본 레이아웃 구조만 작성 (실제 컨텐츠는 후속 서브태스크에서 구현)
5. metadata export로 페이지 타이틀 설정: { title: 'Bandage - 밴드 합주 관리 플랫폼' }

### 10.2. 온보딩 Hero 섹션 구현 (gradient 배경 + rings + 로고 + CTA)

**Status:** pending  
**Dependencies:** 10.1  

AuthBrand 스타일의 gradient 배경과 decorative rings, 로고, 타이틀, CTA 버튼을 포함한 Hero 섹션을 구현합니다.

**Details:**

1. src/app/onboarding/page.tsx에 Hero 섹션 구현
2. 전체 화면 gradient 배경 적용: style={{ backgroundImage: 'var(--gradient-auth-brand)' }}
3. AuthBrand의 decorative rings 패턴 재사용 (400px, 280px, 160px 원형 + oklch 투명도)
4. 중앙 정렬된 콘텐츠 영역:
   - Guitar 아이콘 로고 (h-18 w-18, bg-accent-dim 배경)
   - 'Bandage' 타이틀 (text-display font-black)
   - 태그라인: '밴드의 합주·공연을 한 곳에서' (text-subtitle text-foreground-sub)
5. CTA 버튼 그룹 (flex gap-s-4 mt-s-8):
   - [시작하기] → Link href={ROUTES.JOIN}, Button variant='primary' size='lg'
   - [이미 계정이 있어요] → Link href={ROUTES.LOGIN}, Button variant='ghost' size='lg'
6. 접근성: main 랜드마크, h1 태그 사용, CTA 버튼 focus-visible ring 확인

### 10.3. 온보딩 Features 섹션 구현 (3대 축 기능 소개)

**Status:** pending  
**Dependencies:** 10.2  

합주 일정 관리, 세션 편성, 공연 연결 세 가지 핵심 기능을 소개하는 Features 섹션을 구현합니다.

**Details:**

1. Hero 섹션 아래에 Features 섹션 추가
2. 모바일(기본): 단일 column 스택 레이아웃 (flex flex-col gap-s-6)
3. 데스크톱(lg:): 3열 grid 레이아웃 (lg:grid lg:grid-cols-3 lg:gap-s-8)
4. 각 feature 아이템 구조:
   - 아이콘: Calendar(합주 일정), Users(세션 편성), Music(공연 연결) from lucide-react
   - 아이콘 컨테이너: h-12 w-12 rounded-lg bg-accent-dim flex items-center justify-center
   - 제목: text-subtitle font-semibold text-foreground
   - 설명: text-body text-foreground-sub (1-2줄)
   - 기능별 설명:
     * 합주 일정 관리: '밴드별 합주 스케줄을 한눈에 확인하고 관리하세요'
     * 세션 편성: '곡별 세션 배정으로 누가 어떤 파트를 맡는지 명확하게'
     * 공연 연결: '예정된 공연과 셋리스트를 팀원들과 공유하세요'
5. 전체 섹션 max-w-4xl mx-auto px-s-4 py-s-12 적용
6. 접근성: section 태그 + aria-labelledby로 heading 연결

### 10.4. middleware.ts 수정 - 비인증 루트 리다이렉트 타깃을 /onboarding으로 변경

**Status:** pending  
**Dependencies:** 10.1  

기존 비인증 사용자의 보호 라우트 접근 시 /login 대신 /onboarding으로 리다이렉트하도록 middleware를 수정합니다.

**Details:**

1. src/middleware.ts 수정:
   - 기존: const loginUrl = new URL('/login', request.url)
   - 변경: const onboardingUrl = new URL('/onboarding', request.url)
   - from 파라미터는 그대로 유지 (onboardingUrl.searchParams.set('from', pathname + search))
2. 변수명도 loginUrl → onboardingUrl로 변경하여 의미 명확화
3. /login, /join, /password-change 등 기존 public auth 라우트는 그대로 직접 접근 가능하게 유지
4. /onboarding 자체는 matcher에 포함되지 않으므로 public 접근 가능 (현재 matcher가 /home, /bands 등만 포함)
5. 기존 E2E 테스트(auth.spec.ts, home.spec.ts)의 /login 기대값을 /onboarding으로 수정 필요 (별도 서브태스크)

### 10.5. Playwright E2E 테스트 작성 및 기존 테스트 업데이트

**Status:** pending  
**Dependencies:** 10.2, 10.3, 10.4  

온보딩 페이지 E2E 테스트를 신규 작성하고, 기존 auth/home 테스트의 리다이렉트 기대값을 /onboarding으로 수정합니다.

**Details:**

1. tests/e2e/onboarding.spec.ts 신규 작성:
   - test('비인증 사용자가 /onboarding 접근 시 정상 렌더링된다')
     * page.goto('/onboarding'), expect(heading 'Bandage').toBeVisible()
   - test('인증된 사용자가 /onboarding 접근 시 /home으로 리다이렉트된다')
     * TODO(backend) 주석으로 남김 (refreshToken 쿠키 설정 필요)
   - test('[시작하기] 버튼 클릭 시 /join으로 이동한다')
     * page.getByRole('link', { name: '시작하기' }).click(), expect(page).toHaveURL(/\/join/)
   - test('[이미 계정이 있어요] 버튼 클릭 시 /login으로 이동한다')
     * page.getByRole('link', { name: '이미 계정이 있어요' }).click(), expect(page).toHaveURL(/\/login/)
2. tests/e2e/auth.spec.ts 수정:
   - /login 리다이렉트 기대값을 /onboarding으로 변경
3. tests/e2e/home.spec.ts 수정:
   - /login 리다이렉트 기대값을 /onboarding으로 변경
4. pnpm test:e2e 실행하여 모든 테스트 통과 확인
