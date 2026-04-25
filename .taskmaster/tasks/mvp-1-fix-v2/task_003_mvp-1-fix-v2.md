# Task ID: 3

**Title:** Phase C: 홈 화면 인사 헤더 및 통계 카드 프로토타입 일치

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** 홈 화면의 PageTitle을 '안녕하세요, {memberName} 님' 인사 형태로 변경, HomeStatCards를 4컬럼 그리드로 재정렬, useMe() 훅으로 사용자 이름 표시

**Details:**

1. src/app/(main)/home/page.tsx 수정:
   - PageTitle 컴포넌트를 HomeGreeting 컴포넌트로 교체
   - design/dist/js/screens/home.js L12-14 참조:
     ```
     '안녕하세요, ${currentUser.name} 님 👋'
     '오늘도 좋은 합주 되세요.'
     ```

2. HomeGreeting 클라이언트 컴포넌트 신규:
   ```tsx
   'use client';
   import { useMe } from '@/domain/member/hooks/useMe';
   export function HomeGreeting() {
     const { data: me, isLoading } = useMe();
     const name = me?.name ?? '';
     return (
       <div className="mb-s-8">
         <h1 className="text-title-lg font-extrabold">
           {name ? `안녕하세요, ${name} 님` : '안녕하세요'}
         </h1>
         <p className="text-foreground-sub text-body mt-1">
           오늘도 좋은 합주 되세요.
         </p>
       </div>
     );
   }
   ```

3. HomeStatCards 수정:
   - 4컬럼 그리드: grid-cols-2 lg:grid-cols-4
   - 항목: 소속 밴드 / 예정 합주 / 예정 공연 / 참여 세션
   - '참여 세션' 데이터 미존재 → mock '—' 표시
   - API_REQUIRED.md에 FE-API-014 (GET /api/v1/members/me/stats) 항목 추가 예정

4. IconTile 적용: 각 StatCard에 도메인별 IconTile 추가

**Test Strategy:**

1. 비로그인 상태에서 '안녕하세요' 폴백 확인
2. 로그인 상태에서 이름 표시 확인
3. 4컬럼 그리드 lg breakpoint 반응형 확인
4. '참여 세션' 통계가 '—'로 표시되는지 확인

## Subtasks

### 3.1. HomeGreeting 클라이언트 컴포넌트 생성

**Status:** pending  
**Dependencies:** None  

useMe() 훅을 사용해 로그인 사용자 이름을 표시하는 인사 헤더 컴포넌트를 신규 생성합니다.

**Details:**

src/app/(main)/home/HomeGreeting.client.tsx 파일 생성:
- 'use client' 디렉티브 선언
- domain/member/hooks/useMe 훅 import 및 호출
- design/dist/js/screens/home.js L12-14 참조하여 레이아웃 구현:
  - h1: '안녕하세요, {name} 님' (로딩/비로그인 시 '안녕하세요' 폴백)
  - p: '오늘도 좋은 합주 되세요.' (text-foreground-sub 스타일)
- mb-s-8 클래스로 하단 여백 적용
- isLoading 상태일 때 Skeleton 표시 고려
- MemberInfoResponse.name 필드 사용 (현재 타입 존재 확인됨)

### 3.2. 홈 페이지에 HomeGreeting 컴포넌트 적용

**Status:** pending  
**Dependencies:** 3.1  

page.tsx에서 기존 PageTitle 컴포넌트를 새로운 HomeGreeting으로 교체합니다.

**Details:**

src/app/(main)/home/page.tsx 수정:
- import 추가: HomeGreeting from './HomeGreeting.client'
- 기존 <PageTitle title="홈" description="..." /> 제거
- <HomeGreeting /> 컴포넌트로 교체
- 전체 레이아웃 space-y-s-8 간격 유지 확인
- Metadata title은 '홈 | Bandage' 그대로 유지 (SEO용)

### 3.3. HomeStatCards 4컬럼 그리드 및 참여 세션 항목 추가

**Status:** pending  
**Dependencies:** None  

통계 카드를 4컬럼 그리드로 변경하고, 4번째 '참여 세션' 카드를 mock 데이터로 추가합니다.

**Details:**

src/app/(main)/home/HomeStatCards.client.tsx 수정:
- 그리드 클래스: grid-cols-2 lg:grid-cols-4 (기존 sm:grid-cols-3 제거)
- 4번째 StatCard 추가:
  - icon: Music (lucide-react에서 가져옴)
  - label: '참여 세션'
  - value: '—' (데이터 미존재로 mock)
  - accent: 'warn' (design/dist/js/screens/home.js L20 참조)
- 주석 업데이트: '참여 세션' API 필요 사항 명시
- Stub 스켈레톤도 4개로 확장 고려

### 3.4. API_REQUIRED.md에 사용자 통계 API 항목 추가

**Status:** pending  
**Dependencies:** 3.3  

Phase C에서 발견된 '참여 세션' 통계 데이터 부재를 문서화하여 백엔드 API 요청 사항으로 기록합니다.

**Details:**

API_REQUIRED.md 파일 수정:
- '신규 기능' 섹션에 FE-API-012 항목 추가
- 엔드포인트: GET /api/v1/members/me/stats
- 요청: Authorization: Bearer {accessToken}
- 기대 응답 스키마:
  ```json
  {
    "bandCount": number,
    "upcomingPracticeCount": number,
    "upcomingPerformanceCount": number,
    "sessionCount": number
  }
  ```
- 프론트 사용처: HomeStatCards 컴포넌트
- 현재 우회: bandCount/practice/performance는 각 목록 API length, sessionCount는 mock '—'
- 백엔드 체크리스트: MemberStatsResponse DTO, MemberService.getStats(), 테스트
