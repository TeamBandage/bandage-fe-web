# Task ID: 4

**Title:** Phase D: 밴드 상세 탭 4분할 (정보/멤버/일정·합주/밴드 관리)

**Status:** pending

**Dependencies:** 1, 2

**Priority:** high

**Description:** BandDetailContent의 탭을 정보/멤버/일정 및 합주/밴드 관리 4개로 분할, '밴드 관리' 탭은 LEADER 전용(RoleGuard role='LEADER'), '일정 및 합주' 탭은 API 미존재로 서비스 준비 중 EmptyState 표시

**Details:**

1. src/app/(main)/bands/[bandId]/BandDetailContent.client.tsx 수정:
   - 기존 탭: info, members, applications(ADMIN)
   - 변경 탭: info(정보), members(멤버), schedule(일정 및 합주), manage(밴드 관리-LEADER)

2. 탭 구성:
   ```tsx
   <Tabs defaultValue="info">
     <TabsList aria-label="밴드 상세 탭">
       <TabsTrigger value="info">정보</TabsTrigger>
       <TabsTrigger value="members">멤버</TabsTrigger>
       <TabsTrigger value="schedule">일정 및 합주</TabsTrigger>
       {hasRole(myRole, 'LEADER') && (
         <TabsTrigger value="manage">밴드 관리</TabsTrigger>
       )}
     </TabsList>
   ```

3. 정보 탭:
   - 프로필 이미지/밴드 이름/설명
   - 통계 카드: 멤버 수, 예정 합주, 예정 공연 (3컬럼)
   - API 미존재 시 mock 데이터 또는 Skeleton

4. 일정 및 합주 탭:
   - 현재 API 미존재 (GET /api/v1/bands/{bandId}/practices, performances)
   - EmptyState: '서비스를 준비하고 있어요' 톤 적용
   - API_REQUIRED.md에 FE-API-009, FE-API-010 추가 예정

5. 밴드 관리 탭:
   - 가입 신청 승인/거절 (기존 applications 내용 이동)
   - RoleGuard role='LEADER' (기존 ADMIN에서 LEADER로 변경)

**Test Strategy:**

1. LEADER 계정으로 4개 탭 모두 표시 확인
2. ADMIN 계정으로 '밴드 관리' 탭 미표시 확인
3. MEMBER 계정으로 정보/멤버/일정 3개 탭만 표시 확인
4. '일정 및 합주' 탭의 EmptyState 메시지 확인
5. pnpm typecheck 통과

## Subtasks

### 4.1. 기존 info 탭 콘텐츠를 통계 카드 포함 정보 탭으로 리팩터링

**Status:** pending  
**Dependencies:** None  

BandDetailContent의 현재 info 탭에 멤버 수/예정 합주/예정 공연 3컬럼 통계 카드 추가, 가입 신청/탈퇴 버튼 유지

**Details:**

1. `BandDetailContent.client.tsx`의 `<TabsContent value="info">` 내부 리팩터링
2. 통계 카드 섹션 추가: `<div className="grid grid-cols-3 gap-3">` 레이아웃
   - 멤버 수: `useBandMembers`로 가져온 총 count 표시 (API에 totalElements 있으면 사용, 없으면 pages.flatMap().length)
   - 예정 합주/공연: API 미존재로 현재 Skeleton 또는 `--` 표시 (목 데이터 삽입 금지)
3. 기존 가입 신청/탈퇴 버튼 블록은 통계 아래로 이동
4. Task 1의 IconTile이 완료되면 각 통계 카드에 도메인 아이콘 적용 가능하도록 구조화
5. 프로필 이미지/밴드 이름/설명은 탭 외부 Card에 이미 있으므로 중복 제거 (현재 `band.description ?? '소개가 등록되지 않았습니다.'` 부분 정리)

### 4.2. '일정 및 합주' 탭 추가 및 EmptyState 표시

**Status:** pending  
**Dependencies:** 4.1  

schedule 탭을 새로 추가하고 API 미존재로 '서비스를 준비하고 있어요' 톤의 EmptyState 표시, API_REQUIRED.md에 FE-API-009/010 항목 추가

**Details:**

1. `TabsList`에 `<TabsTrigger value="schedule">일정 및 합주</TabsTrigger>` 추가 (members 다음 위치)
2. `<TabsContent value="schedule">`에 EmptyState 컴포넌트 렌더링:
   ```tsx
   <EmptyState
     icon={Calendar}
     title="서비스를 준비하고 있어요"
     description="밴드의 합주 및 공연 일정을 곧 확인할 수 있습니다."
   />
   ```
3. `lucide-react`에서 Calendar 아이콘 import
4. API_REQUIRED.md에 FE-API-009, FE-API-010 추가:
   - FE-API-009: `GET /api/v1/bands/{bandId}/practices` — 특정 밴드의 합주 목록
   - FE-API-010: `GET /api/v1/bands/{bandId}/performances` — 특정 밴드의 공연 목록
5. 향후 API 연동 시 이 탭 내부만 교체하면 되도록 `ScheduleTab` 서브 컴포넌트로 분리 권장

### 4.3. '밴드 관리' 탭 추가 및 LEADER 전용 RoleGuard 적용

**Status:** pending  
**Dependencies:** 4.1  

기존 applications 탭을 manage로 이름 변경, ADMIN에서 LEADER 역할로 권한 상향, 가입 신청 승인/거절 기능 이동

**Details:**

1. 기존 `canSeeApplications = hasRole(myRole, 'ADMIN')` 를 `canManage = hasRole(myRole, 'LEADER')` 로 변경
2. `TabsTrigger value="applications"` → `value="manage"`, 라벨을 '밴드 관리'로 변경
3. `TabsContent value="applications"` → `value="manage"`로 변경
4. 내부 `RoleGuard role="ADMIN"` → `role="LEADER"`로 변경
5. 탭 내부 구조:
   - 상단: '가입 신청 관리' 섹션 헤딩 (선택적)
   - 기존 ApplicationsTab 컴포넌트 그대로 유지
6. 향후 밴드 설정/삭제/위임 등 관리 기능 추가 시 이 탭에 추가 섹션 배치 예정
7. fallback 메시지를 '접근 권한이 없습니다'에서 '리더만 접근할 수 있습니다'로 변경 (선택적)

### 4.4. TabsList aria-label 및 4탭 통합 테스트

**Status:** pending  
**Dependencies:** 4.1, 4.2, 4.3  

TabsList에 접근성 aria-label 추가, 4개 탭(정보/멤버/일정 및 합주/밴드 관리) 통합 렌더링 및 역할별 조건 테스트

**Details:**

1. `<TabsList>` 에 `aria-label="밴드 상세 탭"` 속성 추가 (접근성 보강)
2. 최종 탭 순서 확인: info → members → schedule → manage(LEADER only)
3. 전체 코드 정리:
   - 불필요한 import 정리 (LogOut, UserPlus 등 info 탭 버튼에서만 사용)
   - `canSeeApplications` 변수 제거 후 `canManage`로 통일
4. `pnpm typecheck && pnpm lint` 실행 및 오류 수정
5. 수동 테스트 시나리오 문서화:
   - LEADER: 4개 탭 모두 표시
   - ADMIN: 정보/멤버/일정 3개 탭 표시
   - MEMBER: 정보/멤버/일정 3개 탭 표시
   - 비회원: 정보/멤버/일정 3개 탭 표시, 가입 신청 버튼 활성
