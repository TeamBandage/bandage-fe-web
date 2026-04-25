# Task ID: 5

**Title:** Phase E: 오류/빈상태 톤 완화 (서비스 준비 중)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** ErrorState, ErrorBoundary, app/error.tsx 등 모든 오류 컴포넌트의 AlertTriangle/빨간색 톤을 Wrench/Construction 아이콘 + text-foreground-sub 톤으로 변경, 기본 카피를 '서비스를 준비하고 있어요'로 통일

**Details:**

1. src/components/feedback/error-state.tsx 수정:
   ```tsx
   import { Wrench } from 'lucide-react';
   // AlertTriangle → Wrench
   // text-danger → text-foreground-sub
   // 기본 title: '서비스를 준비하고 있어요'
   // 기본 description: '잠시 후 다시 시도하거나 다른 메뉴를 이용해 주세요.'
   ```

2. src/components/feedback/error-boundary.tsx 수정:
   - 동일 톤 적용

3. src/app/error.tsx 수정:
   - unrecoverable 상황만 약한 강조 톤(amber) 사용
   - 그 외는 Wrench + 준비 중 톤

4. ErrorState 사용처 전체 확인 (12개 파일):
   - BandDetailContent.client.tsx
   - PracticeDetailContent.client.tsx
   - PerformanceDetailContent.client.tsx
   - 기타 각 도메인 리스트/상세 컴포넌트

5. EmptyState도 동일 톤 유지 (기존 유지, 필요시 일관성 조정)

**Test Strategy:**

1. 의도적 API 오류 발생시켜 ErrorState 시각 확인
2. 네트워크 오프라인 상태에서 표시 확인
3. 빨간색/AlertTriangle이 더 이상 나타나지 않는지 전체 검색
4. role='alert' 유지 확인 (접근성)
5. pnpm build 통과

## Subtasks

### 5.1. ErrorState 컴포넌트 아이콘/톤 변경 및 기본 카피 업데이트

**Status:** pending  
**Dependencies:** None  

src/components/feedback/error-state.tsx에서 AlertTriangle 아이콘을 Wrench 아이콘으로 변경하고, text-danger 스타일을 text-foreground-sub로 변경하며, 기본 title/description 카피를 '서비스를 준비하고 있어요' 톤으로 통일합니다.

**Details:**

1. lucide-react에서 AlertTriangle import를 Wrench import로 변경
2. 아이콘 색상 클래스를 text-danger에서 text-foreground-sub로 변경
3. 기본 title을 '오류가 발생했습니다'에서 '서비스를 준비하고 있어요'로 변경
4. 기본 description을 '잠시 후 다시 시도해 주세요.'에서 '잠시 후 다시 시도하거나 다른 메뉴를 이용해 주세요.'로 변경
5. role='alert' 속성은 접근성을 위해 유지
6. aria-hidden='true' 아이콘 속성 유지

### 5.2. ErrorBoundary 기본 fallback ErrorState 톤 일관성 적용

**Status:** pending  
**Dependencies:** 5.1  

src/components/feedback/error-boundary.tsx에서 기본 fallback으로 사용되는 ErrorState가 변경된 톤을 그대로 상속받도록 확인하고, 필요시 description 카피를 조정합니다.

**Details:**

1. ErrorBoundary의 render 메서드에서 기본 fallback으로 렌더링되는 ErrorState 확인 (42행)
2. 현재 error.message를 description으로 전달하고 있으므로 기본 title은 ErrorState의 새 기본값('서비스를 준비하고 있어요')이 적용됨
3. ErrorBoundary 자체에는 아이콘/색상 직접 지정이 없으므로 subtask 1의 ErrorState 변경이 자동 반영됨
4. 필요시 fallback 호출 시 적절한 title 명시 여부 검토

### 5.3. app/error.tsx 글로벌 에러 페이지 톤 완화 적용

**Status:** pending  
**Dependencies:** 5.1  

src/app/error.tsx에서 unrecoverable 상황에만 약한 강조 톤(amber)을 사용하고, 일반적인 에러 상황에서는 Wrench + 준비 중 톤으로 표시되도록 ErrorState 사용 방식을 조정합니다.

**Details:**

1. 현재 GlobalError 컴포넌트에서 ErrorState를 사용하며 title='화면을 불러올 수 없습니다'로 커스텀 지정됨
2. 일반 에러의 경우 title을 '서비스를 준비하고 있어요' 또는 유사한 부드러운 톤으로 변경
3. unrecoverable 에러(예: chunk load failure 등 복구 불가능한 상황) 판별 로직 추가 고려
4. 복구 불가능한 상황에서만 amber 톤 적용 (text-warn 클래스 활용) 여부는 현재 ErrorState props 구조상 제한적이므로, 필요시 variant prop 추가 검토
5. 기본적으로는 ErrorState의 변경된 기본 톤이 적용되도록 title/description 조정

### 5.4. ErrorState 사용처 전체 검토 및 title/description 카피 조정

**Status:** pending  
**Dependencies:** 5.1  

ErrorState를 사용하는 12개 이상의 파일(BandDetailContent, PracticeDetailContent, PerformanceDetailContent, BandsList, PracticesList, PerformancesList, MeContent, MyBands, UpcomingPractices, UpcomingPerformances 등)에서 기존 title 또는 description 커스텀 값이 새로운 '서비스 준비 중' 톤과 일관성 있는지 검토하고 필요시 조정합니다.

**Details:**

1. 사용처별 현재 커스텀 카피 확인:
   - BandDetailContent: title='밴드를 찾을 수 없습니다'
   - PracticeDetailContent: title='합주를 찾을 수 없습니다'
   - PerformanceDetailContent: title='공연을 찾을 수 없습니다'
   - BandsList: description='밴드 목록을 불러오지 못했습니다.'
   - PracticesList: description='합주 목록을 불러오지 못했습니다...'
   - PerformancesList: description='공연 목록을 불러오지 못했습니다.'
   - MeContent: description='회원 정보를 불러오지 못했습니다.'
   - MyBands: description='밴드 목록을 불러오지 못했습니다.'
   - UpcomingPractices: description='가까운 합주를 불러오지 못했습니다.'
   - UpcomingPerformances: description='예정 공연을 불러오지 못했습니다.'
2. 기존 커스텀 카피가 기능적으로 유의미한 정보를 제공하므로 대부분 유지
3. 빨간색/AlertTriangle이 코드베이스 전체에서 더 이상 나타나지 않는지 grep으로 최종 검증
4. EmptyState와의 톤 일관성 확인 (EmptyState는 이미 text-foreground-muted 사용 중)
