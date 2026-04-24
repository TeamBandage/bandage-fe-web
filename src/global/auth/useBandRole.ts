'use client';

import { useQuery } from '@tanstack/react-query';

import { getBandMembers } from '@/domain/band/api/getBandMembers';
import { useMe } from '@/domain/member/hooks/useMe';
import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import type { BandRole } from '@/global/types';

const MAX_PAGE_SIZE = 100;

/**
 * 현재 로그인한 유저의 해당 밴드 내 역할(BandRole)을 반환합니다.
 * 미멤버이거나 조회 실패 시 null.
 *
 * 구현 주의: 백엔드 BandInfoResponse 에 아직 myRole 필드가 없으므로,
 *   1) useMe 로 현재 memberId 확보
 *   2) /bands/{bandId}/members 를 최대 100건 페이지로 조회해 매칭
 * 방식으로 도출합니다. 백엔드가 myRole 을 제공하기 시작하면 useBandDetail 경유로 단순화 가능.
 */
export function useBandRole(bandId: string) {
  const authenticated = useIsAuthenticated();
  const { data: me } = useMe({ enabled: authenticated });
  const memberId = me?.id;

  return useQuery<BandRole | null, Error>({
    queryKey: [...queryKeys.band.members(bandId), 'my-role', memberId ?? null],
    queryFn: async () => {
      if (!memberId) return null;
      let cursor: string | undefined;
      let pagesFetched = 0;
      const maxPages = 10;
      while (pagesFetched < maxPages) {
        const page = await getBandMembers(bandId, { lastId: cursor, pageSize: MAX_PAGE_SIZE });
        const match = page.content.find((m) => m.memberId === memberId);
        if (match) return match.role;
        if (!page.hasNext || !page.nextCursor) return null;
        cursor = page.nextCursor;
        pagesFetched += 1;
      }
      return null;
    },
    enabled: !!bandId && authenticated && memberId != null,
    staleTime: 60 * 1000,
  });
}
