# Task ID: 1

**Title:** 마이페이지 프로필 UI 재구성 (BD-65)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 이미지 참조 기반으로 마이페이지 레이아웃을 재구성한다. 사이드바 GNB에 로그아웃 버튼 추가, 프로필 섹션 헤더 분리, 모바일 전용 로그아웃 섹션 추가, 계정 탈퇴 섹션 인라인 재구성.

**Details:**

No details provided.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 1.1. 프로필 섹션 헤더 컴포넌트 분리 및 레이아웃 개선

**Status:** done  
**Dependencies:** None  

MeContent.client.tsx의 프로필 정보 섹션을 독립 컴포넌트로 분리하고, 헤더('프로필 정보' 타이틀 + 수정 버튼)와 콘텐츠 영역의 시각적 계층 구조를 명확히 한다.

**Details:**

1. ProfileSection 컴포넌트 추출 (또는 인라인 구조 개선)
2. 섹션 헤더(h2 + Button)를 별도 SectionHeader 패턴으로 정리
3. ProfileImageUpload, 이름, 이메일, 연락처 영역 레이아웃 재정비
4. EditCard 모드 전환 시 애니메이션/전환 효과 고려
5. Tailwind 클래스 정리 및 디자인 토큰 일관성 확보

### 1.2. 모바일 전용 로그아웃 섹션 UI 개선

**Status:** done  
**Dependencies:** 1.1  

lg:hidden으로 숨겨진 모바일 로그아웃 섹션의 스타일링을 개선하고, 버튼 인터랙션 및 피드백을 보강한다.

**Details:**

1. 현재 Card + Button 구조 유지하되 시각적 일관성 개선
2. 로그아웃 버튼 아이콘(LogOut) 크기/위치 미세 조정
3. loading 상태일 때 버튼 disabled 스타일 확인
4. 섹션 간 간격(space-y-s-6) 일관성 유지
5. 터치 영역(44px 최소) 확보 및 접근성 속성 보강

### 1.3. 계정 탈퇴 섹션 인라인 재구성

**Status:** done  
**Dependencies:** 1.1  

계정 탈퇴 섹션의 레이아웃을 인라인 형태로 재구성하여 경고 메시지와 탈퇴 버튼이 한 줄에 배치되도록 개선한다.

**Details:**

1. 현재 flex items-center justify-between 구조 유지 및 개선
2. 경고 텍스트 스타일(text-foreground-sub) 가독성 확보
3. '회원 탈퇴' 버튼 variant='danger' 시각적 강조
4. 반응형 처리: 좁은 화면에서 세로 스택으로 전환 고려(sm:flex-col)
5. Dialog 트리거 연결 유지 및 UX 플로우 검증

### 1.4. 사이드바 GNB 로그아웃 버튼 스타일 및 위치 검증

**Status:** done  
**Dependencies:** None  

sidebar.tsx의 로그아웃 버튼이 이미 구현되어 있으므로, 디자인 참조 이미지 기반으로 스타일/위치가 일치하는지 검증하고 필요시 미세 조정한다.

**Details:**

1. 현재 구현: border-t 영역 하단에 Avatar + 로그아웃 버튼 배치됨
2. 디자인 이미지와 대조하여 아이콘 크기(h-4 w-4), 패딩(px-s-3 py-s-2), 폰트(text-caption) 일치 확인
3. hover/focus 상태 스타일(hover:bg-card, focus-visible:ring-accent) 검증
4. disabled 상태(logoutMutation.isPending) 시각적 피드백 확인
5. 필요시 Tailwind 클래스 조정 및 접근성 속성(aria-label) 보강
