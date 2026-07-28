'use client';

import { useMemo } from 'react';

import { useMyBands } from '@/domain/band/hooks/useMyBands';
import { useIsAuthenticated } from '@/global/store/authStore';
import type { BandRole } from '@/global/types';

/**
 * 현재 로그인한 유저의 해당 밴드 내 역할(BandRole)을 반환합니다.
 * 미멤버이거나 미인증 시 null.
 *
 * 구현: API_SPEC §3-3-1 의 `MyBandInfoResponse.myRole` 을 그대로 매핑.
 * `useMyBands` 캐시를 공유하므로 별도 네트워크 호출 없이 동기적으로 풀린다.
 */
export function useBandRole(bandId: string) {
  const authenticated = useIsAuthenticated();
  const myBandsQuery = useMyBands(100);

  const data = useMemo<BandRole | null>(() => {
    if (!authenticated || !myBandsQuery.data) return null;
    const found = myBandsQuery.data.pages
      .flatMap((p) => p.content)
      .find((b) => b.bandId === bandId);
    return found ? found.myRole : null;
  }, [authenticated, myBandsQuery.data, bandId]);

  return {
    data,
    isLoading: myBandsQuery.isLoading,
    isError: myBandsQuery.isError,
    error: myBandsQuery.error,
  };
}
