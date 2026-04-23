# Task ID: 7

**Title:** 밴드(Band) 도메인 구현

**Status:** pending

**Dependencies:** 6

**Priority:** high

**Description:** 밴드 생성, 목록 조회(무한 스크롤), 상세 조회, 멤버 관리, 가입 신청/승인/거절, 리더 위임, 탈퇴 기능을 구현합니다. 역할 기반 UI 가드를 적용합니다.

**Details:**

1. src/domain/band/types/req.ts:
```ts
export interface CreateBandRequest {
  name: string;
  description?: string;
  profileImg?: string;
}
```

2. src/domain/band/types/res.ts:
```ts
export interface CreateBandResponse {
  bandId: string;
  bandName: string;
}

export interface BandInfoResponse {
  bandId: string;
  bandName: string;
  description?: string;
  profileImg?: string;
}

export interface BandMemberInfoResponse {
  bandMemberId: string;
  memberId: number;
  role: BandRole;
}

export interface BandApplicationInfoResponse {
  bandApplicationId: string;
  memberId: number;
  status: ApplicationStatus;
}
```

3. src/domain/band/types/schema.ts - zod 스키마

4. src/domain/band/api/:
- createBand.ts, getBand.ts, listBands.ts
- getBandMember.ts, listBandMembers.ts
- applyBand.ts, withdrawApplication.ts, listApplications.ts, decideApplication.ts
- delegateLeader.ts, leaveBand.ts

5. src/domain/band/hooks/:
- useCreateBand.ts (useMutation)
- useBandList.ts (useInfiniteCursor)
- useBandDetail.ts (useQuery)
- useBandMembers.ts (useInfiniteCursor)
- useBandMember.ts (useQuery)
- useBandApplications.ts (useInfiniteCursor)
- useApplyBand.ts, useWithdrawApplication.ts, useDecideApplication.ts (useMutation)
- useDelegateLeader.ts, useLeaveBand.ts (useMutation)

6. src/global/auth/useBandRole.ts - 현재 유저의 밴드 내 역할 조회 훅

7. src/global/auth/RoleGuard.tsx:
```tsx
'use client';
import { useBandRole } from './useBandRole';
import { BandRole } from '@/global/types/ApiResponse';

const roleHierarchy: Record<BandRole, number> = { LEADER: 3, ADMIN: 2, MEMBER: 1 };

export function RoleGuard({ bandId, role, children, fallback = null }: {
  bandId: string;
  role: BandRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: userRole } = useBandRole(bandId);
  if (!userRole || roleHierarchy[userRole] < roleHierarchy[role]) return fallback;
  return <>{children}</>;
}
```

8. src/domain/band/components/:
- BandCard.tsx - 목록용 카드
- BandListItem.tsx - 간단한 목록 아이템
- BandMemberRow.tsx - 멤버 행
- BandApplicationRow.tsx - 신청 행 (승인/거절 버튼)
- BandRoleBadge.tsx - LEADER/ADMIN/MEMBER 배지

9. src/app/(main)/bands/page.tsx - 무한 스크롤 목록 + 생성 FAB

10. src/app/(main)/bands/new/page.tsx + BandCreateForm.client.tsx

11. src/app/(main)/bands/[bandId]/page.tsx:
- Tabs: 개요 / 멤버 / 가입신청(LEADER/ADMIN만)
- 개요: 밴드 정보 + 가입 신청 버튼(비멤버) / 탈퇴 버튼(멤버)
- 멤버: 무한 스크롤 멤버 목록 + 리더 위임 버튼(LEADER만)
- 가입신청: 신청 목록 + 승인/거절 액션

**Test Strategy:**

밴드 생성 → 상세 조회 → 다른 계정으로 가입 신청 → 리더가 승인 → 멤버 목록에 반영 → 리더 위임 → 탈퇴 플로우 수동 테스트

## Subtasks

### 7.1. 밴드 도메인 타입 및 스키마 정의

**Status:** pending  
**Dependencies:** None  

백엔드 API 스펙과 1:1로 대응하는 밴드 도메인의 요청/응답 DTO 타입 및 Zod 검증 스키마를 정의합니다.

**Details:**

1. src/domain/band/types/req.ts 생성:
   - CreateBandRequest: name(필수), description?(선택), profileImg?(선택)
   - ApplyBandRequest: message?(선택)
   - DecideBandApplicationRequest: applicationId, decision('APPROVED'|'REJECTED')
   - DelegateLeaderRequest: newLeaderId

2. src/domain/band/types/res.ts 생성:
   - CreateBandResponse: bandId, bandName
   - BandInfoResponse: bandId, bandName, description?, profileImg?, memberCount?, myRole?
   - BandMemberInfoResponse: bandMemberId, memberId, memberName, role(BandRole), profileImg?
   - BandApplicationInfoResponse: bandApplicationId, memberId, memberName, status(ApplicationStatus), message?, appliedAt

3. src/domain/band/types/schema.ts 생성:
   - createBandSchema: name(1~50자, 필수), description(최대 200자), profileImg(URL 형식)
   - applyBandSchema: message(최대 200자)
   - 백엔드 NotBlank, Size 어노테이션과 동일한 검증 규칙 적용

### 7.2. 밴드 도메인 API 함수 및 Query 훅 구현

**Status:** pending  
**Dependencies:** 7.1  

밴드 CRUD, 멤버 관리, 가입 신청 처리를 위한 API 함수와 TanStack Query 훅을 구현합니다.

**Details:**

1. src/domain/band/api/ 디렉토리에 API 함수 생성:
   - getBands.ts: GET /api/v1/bands (커서 페이징, lastId, pageSize 파라미터)
   - getBandDetail.ts: GET /api/v1/bands/{bandId}
   - createBand.ts: POST /api/v1/bands
   - getBandMembers.ts: GET /api/v1/bands/{bandId}/members (커서 페이징)
   - applyBand.ts: POST /api/v1/bands/{bandId}/applications
   - withdrawApplication.ts: DELETE /api/v1/bands/{bandId}/applications
   - getBandApplications.ts: GET /api/v1/bands/{bandId}/applications (LEADER/ADMIN용)
   - decideApplication.ts: PATCH /api/v1/bands/{bandId}/applications/{applicationId}
   - delegateLeader.ts: PATCH /api/v1/bands/{bandId}/leader
   - leaveBand.ts: DELETE /api/v1/bands/{bandId}/members/me

2. src/domain/band/hooks/ 디렉토리에 훅 생성:
   - useBandList.ts: useInfiniteCursor 래퍼 (queryKeys.band.list() 사용)
   - useBandDetail.ts: useQuery 래퍼 (queryKeys.band.detail(id) 사용)
   - useBandMembers.ts: useInfiniteCursor 래퍼
   - useBandApplications.ts: useInfiniteCursor 래퍼 (상태 필터 지원)
   - useCreateBand.ts: useMutation (성공 시 목록 invalidate, 토스트)
   - useApplyBand.ts, useWithdrawApplication.ts, useDecideApplication.ts: useMutation
   - useDelegateLeader.ts, useLeaveBand.ts: useMutation (확인 다이얼로그 연동)

### 7.3. 역할 기반 UI 가드 및 밴드 역할 훅 구현

**Status:** pending  
**Dependencies:** 7.2  

현재 사용자의 밴드 내 역할을 조회하는 훅과 역할 기반 조건부 렌더링을 위한 RoleGuard 컴포넌트를 구현합니다.

**Details:**

1. src/global/auth/useBandRole.ts 생성:
   - useBandRole(bandId: string) 훅: 현재 유저의 해당 밴드 내 역할(BandRole) 반환
   - useBandDetail 훅의 myRole 필드 활용 또는 별도 API 호출
   - 비멤버인 경우 null 반환

2. src/global/auth/RoleGuard.tsx 생성:
   - Props: bandId, role(BandRole), children, fallback?
   - roleHierarchy: { LEADER: 3, ADMIN: 2, MEMBER: 1 } 정의
   - 현재 유저 역할이 요구 역할 이상일 때만 children 렌더링
   - 권한 부족 시 fallback 렌더링 (기본값 null)
   - 로딩 중일 때 Skeleton 또는 null 반환

3. 권한별 UI 가드 사용 예시:
   - <RoleGuard bandId={id} role="LEADER">리더 위임 버튼</RoleGuard>
   - <RoleGuard bandId={id} role="ADMIN">가입 신청 탭</RoleGuard>
   - 버튼 disabled 처리: disabled={userRole !== 'LEADER'}

### 7.4. 밴드 도메인 컴포넌트 구현

**Status:** pending  
**Dependencies:** 7.1, 7.3  

밴드 목록, 상세, 멤버 관리, 가입 신청 처리에 필요한 재사용 가능한 UI 컴포넌트를 구현합니다.

**Details:**

1. src/domain/band/components/ 디렉토리 생성 및 컴포넌트 구현:

2. BandCard.tsx - 밴드 목록용 카드:
   - Card 컴포넌트 활용, interactive={true}
   - Avatar(프로필 이미지), 밴드명, 설명(2줄 truncate), 멤버 수
   - 클릭 시 상세 페이지로 이동 (ROUTES.BAND_DETAIL(bandId))

3. BandRoleBadge.tsx - 역할 배지:
   - Badge 컴포넌트 활용
   - LEADER: accent 색상, ADMIN: success 색상, MEMBER: default 색상
   - 한글 라벨: '리더', '관리자', '멤버'

4. BandMemberRow.tsx - 멤버 목록 행:
   - Avatar, 멤버명, BandRoleBadge, 리더 위임 버튼(LEADER만 표시)
   - RoleGuard로 위임 버튼 감싸기

5. BandApplicationRow.tsx - 가입 신청 행:
   - Avatar, 신청자명, 신청 메시지(truncate), 신청일시
   - 승인/거절 버튼 (useDecideApplication 연동)
   - 승인/거절 시 확인 다이얼로그

6. BandCreateForm.client.tsx - 밴드 생성 폼:
   - react-hook-form + zodResolver(createBandSchema) 사용
   - Input(밴드명), Textarea(설명), 이미지 업로드(향후 확장)
   - useCreateBand 훅 연동, 성공 시 상세 페이지로 이동

### 7.5. 밴드 페이지 및 라우트 구현

**Status:** pending  
**Dependencies:** 7.2, 7.4  

밴드 목록(무한 스크롤), 생성, 상세(탭: 개요/멤버/가입신청) 페이지를 App Router 구조로 구현합니다.

**Details:**

1. src/app/(main)/bands/page.tsx - 밴드 목록 페이지:
   - useBandList 훅으로 무한 스크롤 구현
   - BandCard 컴포넌트로 각 밴드 렌더링
   - EmptyState: 밴드 없을 때 '아직 참여 중인 밴드가 없습니다'
   - FAB(Floating Action Button): 우하단에 밴드 생성 버튼 (+)
   - Header: title='밴드', left=false (뒤로가기 숨김)

2. src/app/(main)/bands/new/page.tsx - 밴드 생성 페이지:
   - Header: title='밴드 만들기', left=뒤로가기
   - BandCreateForm.client.tsx 렌더링

3. src/app/(main)/bands/[bandId]/page.tsx - 밴드 상세 페이지:
   - useBandDetail 훅으로 밴드 정보 조회
   - Tabs 컴포넌트로 3개 탭 구성:
     a. 개요 탭: 밴드 정보, 가입 신청 버튼(비멤버), 탈퇴 버튼(멤버)
     b. 멤버 탭: useBandMembers 무한 스크롤, 리더 위임 버튼(LEADER만)
     c. 가입 신청 탭: RoleGuard role="ADMIN", useBandApplications 무한 스크롤
   - ErrorState: 밴드를 찾을 수 없을 때 404 처리
   - 탈퇴/리더 위임 시 확인 다이얼로그 (useConfirmDialog)

4. 낙관적 업데이트 적용:
   - 가입 신청 승인/거절 후 신청 목록에서 즉시 제거
   - 멤버 탈퇴 후 멤버 목록에서 즉시 제거
