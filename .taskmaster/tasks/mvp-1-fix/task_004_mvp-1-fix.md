# Task ID: 4

**Title:** Auth 분할 레이아웃 및 관련 컴포넌트 구현

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** (auth) 레이아웃을 데스크톱에서 좌측 AuthBrand 패널 + 우측 480px AuthFormPanel 구조로 개편하고, StepIndicator와 PasswordStrength 컴포넌트를 구현한다.

**Details:**

1. src/components/layout/auth-split.tsx 구현:
   - AuthBrand: gradient 배경(--gradient-auth-brand) + 장식 링 3개 + 로고(72x72) + 타이틀(40px) + tagline + feature chips
   - AuthFormPanel: width 480px, max-w 360px inner, 중앙 정렬

2. src/components/ui/step-indicator.tsx 구현:
   - props: steps: string[], current: number
   - 현재 단계는 accent 색상, 완료 단계는 체크 아이콘
   - 단계 사이 연결 라인

3. src/components/ui/password-strength.tsx 구현:
   - props: password: string
   - 규칙 기반 4단계 점수: 8자 이상, 대문자, 숫자, 특수문자
   - 4단 막대 UI + 레벨 라벨(약함/보통/강함/매우 강함)

4. src/app/(auth)/layout.tsx 수정:
   - 960px 이상: AuthBrand(hidden lg:flex) + AuthFormPanel
   - 960px 미만: 기존 중앙 정렬 유지

5. /join 페이지에 StepIndicator 적용 (기본 정보 → 계정 설정)
6. /join, /password-change 페이지에 PasswordStrength 적용

**Test Strategy:**

1. 각 새 컴포넌트에 Vitest 스냅샷 테스트 작성
2. 데스크톱(1440px)에서 AuthBrand + AuthFormPanel 분할 렌더링 확인
3. 모바일(375px)에서 AuthBrand 숨김, 기존 중앙 정렬 확인
4. Playwright E2E: 로그인/회원가입 플로우 데스크톱+모바일 테스트

## Subtasks

### 4.1. AuthBrand 및 AuthFormPanel 컴포넌트 구현

**Status:** pending  
**Dependencies:** None  

데스크톱 Auth 분할 레이아웃을 위한 AuthBrand(좌측 브랜딩 패널)와 AuthFormPanel(우측 폼 패널) 컴포넌트를 src/components/layout/auth-split.tsx에 구현한다.

**Details:**

1. src/components/layout/auth-split.tsx 파일 생성
2. AuthBrand 컴포넌트 구현:
   - gradient 배경: linear-gradient(145deg, #0D0D1E 0%, #111128 100%)
   - 장식 링 3개 (lg: 400px, md: 280px, sm: 160px with accent-soft fill)
   - 로고 영역 (72x72px, rounded-xl, accent-dim 배경)
   - 타이틀 'Bandage' (text-[40px] font-black tracking-tight)
   - tagline 텍스트 (text-foreground-sub, max-w-[280px])
   - feature chips 3개: '합주 일정 관리', '세션 배정', '공연 연결' (체크 아이콘 포함)
3. AuthFormPanel 컴포넌트 구현:
   - width: 480px 고정
   - inner container: max-w-[360px] 중앙 정렬
   - bg-surface 배경, flex column 레이아웃
4. AuthSplit 래퍼 컴포넌트: AuthBrand + AuthFormPanel 조합
5. 반응형: AuthBrand는 lg: 이상에서만 표시 (hidden lg:flex)

### 4.2. StepIndicator 컴포넌트 구현

**Status:** pending  
**Dependencies:** None  

다단계 폼 진행 상태를 표시하는 StepIndicator 컴포넌트를 src/components/ui/step-indicator.tsx에 구현한다.

**Details:**

1. src/components/ui/step-indicator.tsx 파일 생성
2. Props 인터페이스 정의:
   - steps: string[] (단계 라벨 배열)
   - current: number (현재 단계 인덱스, 0-based)
   - className?: string
3. 스타일링 구현 (design/dist/css/components.css 277-298 참조):
   - 각 단계는 dot(26x26px) + label로 구성
   - 단계 사이 연결 바 (h-[2px], flex-1)
   - 상태별 스타일:
     * 미완료(i > current): bg-card, border-border, text-muted
     * 현재(i === current): bg-accent, border-accent, text-white
     * 완료(i < current): bg-accent-dim, border-accent, text-accent + 체크 아이콘
   - 완료된 연결 바: bg-accent
4. 접근성: aria-current='step' (현재), aria-label (각 단계)
5. cn() 유틸로 조건부 클래스 적용

### 4.3. PasswordStrength 컴포넌트 구현

**Status:** pending  
**Dependencies:** None  

비밀번호 강도를 시각적으로 표시하는 PasswordStrength 컴포넌트를 src/components/ui/password-strength.tsx에 구현한다.

**Details:**

1. src/components/ui/password-strength.tsx 파일 생성
2. Props 인터페이스 정의:
   - password: string (평가할 비밀번호)
   - className?: string
3. 강도 평가 규칙 구현 (4점 만점):
   - +1: 8자 이상
   - +1: 대문자 + 소문자 포함
   - +1: 숫자 포함
   - +1: 특수문자 포함
4. 레벨 매핑:
   - 0-1점: weak (약함), danger 색상
   - 2-3점: medium (보통), warn 색상
   - 4점: strong (강함), success 색상
5. UI 구현 (design/dist/css/components.css 300-314 참조):
   - 4단 막대 (각각 flex-1, gap-[3px], h-1)
   - 점수에 따라 채워진 막대 개수 및 색상 결정
   - 하단 레벨 라벨 + 힌트 텍스트 ('8자 이상, 대소문자, 숫자, 특수문자 권장')
6. 빈 비밀번호 처리: 막대만 표시 (모두 비활성)

### 4.4. (auth) layout.tsx 반응형 분할 레이아웃 적용

**Status:** pending  
**Dependencies:** 4.1  

src/app/(auth)/layout.tsx를 데스크톱에서 AuthBrand + AuthFormPanel 분할 구조로, 모바일에서는 기존 중앙 정렬을 유지하도록 수정한다.

**Details:**

1. src/app/(auth)/layout.tsx 수정:
   - 기존 단순 중앙 정렬 레이아웃을 AuthSplit 컴포넌트로 교체
   - 960px(lg:) 이상: AuthBrand(hidden lg:flex) + AuthFormPanel 분할
   - 960px 미만: AuthBrand 숨김, AuthFormPanel만 전체 너비로 중앙 정렬
2. AuthFormPanel 내부에 children 배치
3. AuthRedirectIfAuthenticated 유지
4. 레이아웃 구조:
   - 외부: flex w-screen h-screen overflow-hidden
   - AuthBrand: flex-1, 데스크톱 전용 (hidden lg:flex)
   - AuthFormPanel: w-[480px] lg:w-[480px] / 모바일 w-full
5. 기존 max-w-sm 로직은 AuthFormPanel 내부 max-w-[360px]로 대체
6. 최소 높이: min-h-screen 유지

### 4.5. /join 및 /password-change 페이지에 StepIndicator, PasswordStrength 적용

**Status:** pending  
**Dependencies:** 4.2, 4.3, 4.4  

/join 페이지에 StepIndicator를 적용하고(기본 정보 -> 계정 설정), /join과 /password-change 페이지에 PasswordStrength를 적용한다.

**Details:**

1. src/app/(auth)/join/JoinForm.client.tsx 수정:
   - StepIndicator 추가: steps=['기본 정보', '계정 설정'], current=step
   - Step 0: 이름, 연락처 필드
   - Step 1: 이메일, 비밀번호 필드 + PasswordStrength
   - Step 전환 로직 유지 (다음/이전 버튼)
2. src/app/(auth)/password-change/PasswordChangeForm.client.tsx 수정:
   - 새 비밀번호 Input 아래에 PasswordStrength 추가
   - password prop으로 newPassword 상태 전달
3. 폼 레이아웃 조정:
   - StepIndicator는 폼 상단 (auth-form__heading 아래)
   - PasswordStrength는 비밀번호 Input 바로 아래 (-mt-2 mb-4 정도)
4. 기존 zod 스키마 및 react-hook-form 연동 유지
5. 접근성: 각 단계 전환 시 포커스 관리
