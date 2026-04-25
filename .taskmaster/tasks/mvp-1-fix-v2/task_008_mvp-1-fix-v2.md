# Task ID: 8

**Title:** Phase H: 접근성/키보드/반응형 회귀 점검

**Status:** pending

**Dependencies:** 1, 2, 3, 4, 5, 6, 7

**Priority:** medium

**Description:** Phase A~G 작업 완료 후 종합 접근성·반응형·키보드 테스트 수행, DateTimePicker 키보드 네비게이션, 카드/리스트 hover/selected 일관성, ErrorState alert 역할 등 검증 후 보고서 작성

**Details:**

1. 반응형 테스트 (lg:960px 기준):
   - 홈: 4컬럼 통계 → 2컬럼 축소
   - 밴드/합주/공연: 마스터-디테일 ↔ 단일 패널
   - DateTimePicker: Dialog ↔ BottomSheet

2. 키보드 테스트:
   - DateTimePicker 모달:
     - Tab으로 포커스 이동
     - 화살표로 날짜 셀 이동
     - Enter로 날짜 선택
     - Esc로 모달 닫기
   - 탭 컴포넌트: 화살표 키로 탭 전환

3. 접근성 테스트:
   - ErrorState role='alert' 유지 확인
   - IconTile aria-hidden='true'
   - TabsList aria-label 존재 확인
   - 버튼 aria-label 또는 텍스트 라벨

4. 시각 일관성:
   - 모든 도메인 카드에 IconTile 동일 크기/톤
   - hover/selected 상태 전 페이지 동일
   - 빨간 오류 톤 완전 제거 확인

5. 보고서 작성:
   - .taskmaster/report/mvp-1-fix-v2-audit-YYYY-MM-DD.md
   - 발견 이슈, 해결 상태, 잔존 이슈 분류

**Test Strategy:**

1. Chrome DevTools 반응형 모드 (360px, 768px, 960px, 1280px)
2. 키보드만으로 전체 플로우 수행 (마우스 미사용)
3. axe-core 또는 Lighthouse 접근성 스캔
4. 결과를 .taskmaster/report 폴더에 문서화

## Subtasks

### 8.1. 반응형 레이아웃 회귀 테스트

**Status:** pending  
**Dependencies:** None  

lg:960px breakpoint 기준 모든 주요 페이지의 레이아웃 전환 검증

**Details:**

Chrome DevTools를 사용하여 4개 뷰포트(360px, 768px, 960px, 1280px)에서 전체 화면 테스트 수행:

1. 홈 화면 (src/app/(main)/home/page.tsx):
   - HomeStatCards: sm:grid-cols-3 → grid-cols-1 축소 확인
   - 섹션 그리드: lg:grid-cols-2 → grid-cols-1 전환 확인

2. 밴드/합주/공연 마스터-디테일 (src/app/(main)/bands/layout.tsx 등):
   - lg 이상: BandsListPane(360px) + 우측 children 분할
   - lg 미만: ListPane hidden, children만 노출

3. DateTimePicker 모달 (src/components/ui/responsive-sheet.tsx):
   - useIsDesktop() 훅이 960px 기준으로 Dialog/BottomSheet 전환
   - ResponsiveSheetContent 조건부 렌더링 확인

4. 결과 기록: 뷰포트별 레이아웃 스크린샷 및 이슈 목록 작성

### 8.2. 키보드 네비게이션 접근성 테스트

**Status:** pending  
**Dependencies:** None  

DateTimePicker, Tabs, Dialog 등 인터랙티브 컴포넌트의 키보드 조작 검증

**Details:**

마우스 미사용 상태에서 키보드만으로 전체 플로우 수행:

1. DateTimePicker (src/components/ui/date-time-picker.tsx):
   - Tab: 날짜 input → 시 select → 분 select 순차 포커스 이동
   - 현재 구현은 native date input + select이므로 브라우저 기본 키보드 동작
   - Task 6 완료 후: 화살표 날짜 셀 이동, Enter 선택, Esc 모달 닫기 테스트

2. Tabs (src/components/ui/tabs.tsx):
   - Radix UI 기반이므로 화살표 키 탭 전환 기본 지원
   - focus-visible:ring-accent 스타일 확인

3. Dialog/BottomSheet:
   - 모달 오픈 시 포커스 트랩 동작
   - Esc 키로 닫기
   - 닫기 버튼(X) aria-label='닫기' 확인

4. 카드/리스트 아이템 (BandCard, PracticeCard, PerformanceCard):
   - Link 래퍼의 focus-visible:ring-accent 스타일 확인

### 8.3. ARIA 속성 및 시각 일관성 검증

**Status:** pending  
**Dependencies:** 8.1, 8.2  

ErrorState role='alert', IconTile aria-hidden, TabsList aria-label 등 접근성 속성 및 hover/selected 스타일 일관성 점검

**Details:**

접근성 속성 검증:

1. ErrorState (src/components/feedback/error-state.tsx):
   - role='alert' 유지 확인 (line 21)
   - AlertTriangle aria-hidden='true' 확인 (line 27)
   - Task 5 완료 후: Wrench 아이콘 + text-foreground-sub 톤 변경 확인

2. TabsList aria-label:
   - src/components/ui/tabs.tsx에 현재 aria-label 미설정
   - 사용처(BandDetailContent, PracticeDetailContent 등)에서 명시적 aria-label 부여 여부 확인

3. 버튼/링크 라벨:
   - 모든 아이콘 전용 버튼에 aria-label 또는 텍스트 라벨 존재 확인
   - Dialog 닫기 버튼 aria-label='닫기' 확인 (dialog.tsx line 59)

4. 시각 일관성:
   - 도메인 카드 hover:bg-* / selected 상태 전 페이지 동일 확인
   - Card interactive prop의 hover 스타일 일관성
   - text-danger(빨간색) 완전 제거 확인 (Task 5 후)

5. axe-core 또는 Lighthouse 접근성 스캔 실행

### 8.4. 종합 감사 보고서 작성

**Status:** pending  
**Dependencies:** 8.1, 8.2, 8.3  

.taskmaster/report/mvp-1-fix-v2-audit-YYYY-MM-DD.md 형식으로 발견 이슈, 해결 상태, 잔존 이슈 분류 문서화

**Details:**

보고서 구조 (기존 mvp-1-fix-audit-2026-04-25.md 형식 참조):

1. 메타 정보:
   - 작성일, 검증 브랜치/PR, 대상 뷰포트

2. 반응형 테스트 결과:
   - 뷰포트별 레이아웃 상태 테이블 (360/768/960/1280)
   - Sidebar/BottomNav 전환, 마스터-디테일 전환, Dialog/BottomSheet 전환

3. 키보드 접근성 결과:
   - DateTimePicker 키보드 네비게이션 상태
   - Tabs 화살표 키 전환 상태
   - 포커스 트랩/Esc 닫기 상태

4. ARIA/시각 접근성 결과:
   - role='alert', aria-hidden, aria-label 검증 결과
   - axe-core/Lighthouse 스캔 점수 및 주요 경고

5. 발견 이슈 분류:
   - 차단(P0): 즉시 수정 필요
   - 기능저하(P1): 출시 전 수정 권장
   - 품질(P2): 후속 개선
   - 참고: 향후 고려사항

6. 해결 상태 및 잔존 이슈 목록
