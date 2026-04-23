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
