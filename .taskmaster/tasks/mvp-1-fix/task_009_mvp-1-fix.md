# Task ID: 9

**Title:** 모바일 반응형 감사 및 회귀 방지 테스트 확장

**Status:** pending

**Dependencies:** 8

**Priority:** medium

**Description:** 최소 너비 360px 기준으로 전체 화면의 패딩/간격/타이포/터치 타겟을 감사하고, Playwright E2E 스위트를 데스크톱(1440x900)+모바일(375x812) 양쪽으로 확장한다.

**Details:**

1. 모바일 반응형 감사:
   - Container horizontal padding: 모바일 16px / 태블릿 20px / 데스크톱 28px
   - Typography: 본문 14px 이하, PageTitle 모바일 20px / 데스크톱 26~28px
   - Safe area: pb-[env(safe-area-inset-bottom)] 적용 지점 확인 (BottomNav, Toaster)
   - Touch target: 모든 인터랙티브 요소 최소 40x40 보장

2. Playwright E2E 확장:
   - 기존 테스트에 뷰포트 파라미터 추가
   - 데스크톱(1440x900) + 모바일(375x812) 두 뷰포트에서 실행
   - 각 도메인(Auth, Home, Band, Practice, Performance, Me) 해피패스 1개씩
   - 총 12개 시나리오(6 도메인 x 2 뷰포트)

3. /playground 페이지 완성:
   - 토큰 매트릭스(색상, 간격, 타이포, 반경)
   - 컴포넌트 매트릭스(Button, Badge, Card, Chip, Dialog 등 모든 variant)

4. 최종 감사 리포트 작성:
   - .taskmaster/report/mvp-1-fix-audit-YYYY-MM-DD.md
   - 시각 회귀, 남은 이슈, 성능 참고 점수 정리

**Test Strategy:**

1. pnpm test:e2e 실행하여 모든 시나리오 통과 확인
2. 360px/414px 뷰포트에서 각 주요 화면 스크린샷 비교
3. Lighthouse mobile/desktop 점수 기록(합격선 없이 참고용)
4. /playground 페이지에서 모든 토큰/컴포넌트 시각 확인

## Subtasks

### 9.1. 컴포넌트 반응형 패딩/타이포그래피 감사 및 수정

**Status:** pending  
**Dependencies:** None  

Container, PageTitle, Header 컴포넌트의 반응형 패딩과 타이포그래피를 PRD 기준에 맞게 감사하고 수정한다.

**Details:**

1. src/components/layout/container.tsx 수정:
   - 현재 고정 px-4(16px)를 반응형으로 변경
   - 모바일: px-4(16px) / 태블릿 sm: px-5(20px) / 데스크톱 lg: px-7(28px)

2. src/components/layout/page-title.tsx 수정:
   - 현재 고정 text-xl(20px)을 반응형으로 변경
   - 모바일: text-xl(20px) / 데스크톱 lg: text-[26px] 또는 text-2xl

3. src/components/layout/header.tsx 수정:
   - safe-area-inset-top 지원 추가: supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]
   - 반응형 패딩 적용: px-4 sm:px-5 lg:px-7

4. src/components/feedback/toaster.tsx 확인:
   - safe-area-inset-bottom 적용 여부 검토
   - 필요시 supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)] 추가

5. 도메인 카드 컴포넌트(BandCard, PracticeCard, PerformanceCard) 감사:
   - gap, 타이포그래피 반응형 여부 검토
   - 필요시 gap-3 sm:gap-4 등 조정

### 9.2. 터치 타겟 감사 및 접근성 수정

**Status:** pending  
**Dependencies:** 9.1  

모든 인터랙티브 요소가 최소 40x40px 터치 타겟을 충족하는지 감사하고 미달 요소를 수정한다.

**Details:**

1. Button 컴포넌트 감사 (src/components/ui/button.tsx):
   - sm 사이즈 h-8(32px)이 40px 미달 → min-h-10으로 패딩 조정 또는 sm 사이즈 사용처 제한 문서화
   - 아이콘 전용 버튼에 min-w-10 min-h-10 보장

2. 네비게이션 아이템 감사:
   - BottomNav 아이템: flex-1 구조로 충분한 터치 영역 확보 확인
   - Tabs 컴포넌트: 각 탭 버튼 최소 40px 높이 확인

3. 폼 요소 감사:
   - Input: h-10(40px) 충족 확인
   - Checkbox/Radio: 터치 영역 확장 필요시 래퍼에 min-h-10 적용
   - Select/Dropdown 트리거: 40px 이상 확인

4. 리스트 아이템 감사:
   - BandCard, PracticeCard 내 클릭 가능한 영역
   - Dialog/BottomSheet 내 액션 버튼들

5. Chip 컴포넌트 감사:
   - 삭제 가능한 Chip의 X 버튼 터치 영역 (min-w-6 → min-w-10 고려)

### 9.3. Playwright E2E 뷰포트 확장 및 도메인별 해피패스 테스트 추가

**Status:** pending  
**Dependencies:** 9.1, 9.2  

Playwright 설정에 데스크톱(1440x900)+모바일(375x812) 뷰포트를 추가하고, 6개 도메인별 해피패스 시나리오를 구현한다.

**Details:**

1. playwright.config.ts 수정:
   - projects 배열에 모바일 뷰포트 추가: { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }
   - 데스크톱 뷰포트 조정: { name: 'Desktop Chrome', use: { viewport: { width: 1440, height: 900 } } }
   - 선택적으로 iPhone 12 추가: { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }

2. 기존 테스트 파일 구조 유지하며 뷰포트별 실행:
   - tests/e2e/auth.spec.ts: 로그인 → 홈 리다이렉트 해피패스
   - tests/e2e/home.spec.ts: 홈 대시보드 렌더링 및 통계 카드 표시 해피패스
   - tests/e2e/band.spec.ts: 밴드 목록 → 상세 진입 해피패스
   - tests/e2e/practice.spec.ts: 합주 목록 → 상세 진입 해피패스
   - tests/e2e/performance.spec.ts: 공연 목록 → 상세 진입 해피패스
   - tests/e2e/me.spec.ts (신규): 마이페이지 접근 및 프로필 표시 해피패스

3. 각 해피패스 시나리오에 반응형 검증 추가:
   - 모바일: BottomNav 표시, Sidebar 숨김 확인
   - 데스크톱: Sidebar 표시 확인 (Task 2 완료 후)

### 9.4. /playground 페이지 토큰/컴포넌트 매트릭스 완성

**Status:** pending  
**Dependencies:** 9.1  

/playground 페이지에 디자인 토큰 매트릭스(색상, 간격, 타이포, 반경)와 컴포넌트 variant 매트릭스(Button, Badge, Card, Chip, Dialog 등)를 완성한다.

**Details:**

1. src/app/playground/page.tsx 토큰 매트릭스 확장:
   - 색상 섹션: Surface, Foreground, Accent, Status(Success/Warning/Error), Role 색상 전체 표시
   - 간격 섹션: spacing-s-1(4px) ~ spacing-s-12(48px) 시각적 박스로 표현
   - 타이포그래피 섹션: display(40px), title-lg(26px), title(20px), subtitle(18px), body(14px), caption(13px), micro(11px) 샘플 텍스트
   - 반경 섹션: radius-sm(6px), radius-md(10px), radius-lg(14px), radius-full 박스로 표현

2. src/app/playground/components/page.tsx 컴포넌트 매트릭스 확장:
   - Button: 모든 variant(default/accent/ghost/outline/destructive) x size(sm/md/lg) 매트릭스
   - Badge: 모든 variant(default/secondary/success/warning/error) 매트릭스
   - Chip: 선택/삭제 가능 상태 매트릭스
   - Card: variant별 렌더링
   - Dialog/BottomSheet: 트리거 버튼으로 각각 열기
   - Input/Textarea: 상태별(default/error/disabled) 매트릭스
   - Avatar: 크기별 매트릭스

3. 반응형 프리뷰 섹션 추가:
   - 360px/414px/768px/960px iframe 또는 설명 텍스트로 뷰포트별 차이점 문서화

### 9.5. MVP-1 반응형 감사 리포트 작성

**Status:** pending  
**Dependencies:** 9.1, 9.2, 9.3, 9.4  

.taskmaster/report/mvp-1-fix-audit-YYYY-MM-DD.md 파일로 시각 회귀, 남은 이슈, 성능 참고 점수를 정리한 최종 감사 리포트를 작성한다.

**Details:**

1. 리포트 파일 생성: .taskmaster/report/mvp-1-fix-audit-YYYY-MM-DD.md

2. 메타 섹션:
   - 작성일, 검증 주체, 대상 뷰포트(360px/414px/768px/960px/1440px)
   - 검증 도구(Chrome DevTools, Lighthouse, Playwright)

3. 반응형 감사 결과:
   - Container 패딩 검증 결과 (16px/20px/28px 적용 여부)
   - PageTitle 타이포그래피 검증 결과 (20px/26px 적용 여부)
   - Safe-area 적용 지점 목록 (BottomNav, Header, Toaster)
   - 터치 타겟 위반 요소 목록 및 해결 상태

4. E2E 테스트 결과:
   - 총 시나리오 수: 12개 (6 도메인 x 2 뷰포트)
   - 통과/실패 현황 표
   - 실패 시나리오 상세 (있는 경우)

5. Lighthouse 점수 기록 (참고용, 합격선 없음):
   - Mobile: Performance, Accessibility, Best Practices, SEO
   - Desktop: Performance, Accessibility, Best Practices, SEO

6. 남은 이슈 및 권장 조치:
   - P0(차단), P1(기능 저하), P2(품질), P3(참고) 우선순위로 분류
   - 각 이슈에 재현 절차, 추정 원인, 수정 제안 포함

7. 시각 회귀 스크린샷 참조:
   - 주요 화면별 360px/1440px 스크린샷 경로 또는 설명
