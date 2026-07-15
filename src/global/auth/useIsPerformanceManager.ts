'use client';

import { usePerformanceDetail } from '@/domain/performance/hooks/usePerformanceDetail';
import { useMe } from '@/domain/member/hooks/useMe';
import { useIsAuthenticated } from '@/global/store/authStore';

/**
 * 현재 로그인 유저가 해당 공연의 소유자(owner)/매니저인지 판정.
 * managerIds 는 소유자를 제외한 매니저 목록이므로, isManager 는 owner 또는 매니저인 경우 모두 true.
 * 로딩/에러 중에는 false 로 안전하게 반환.
 */
export function useIsPerformanceManager(performanceId: string) {
  const authenticated = useIsAuthenticated();
  const { data: me, isLoading: meLoading } = useMe({ enabled: authenticated });
  const { data: performance, isLoading: perfLoading } = usePerformanceDetail(performanceId, {
    enabled: !!performanceId,
  });

  const isLoading = meLoading || perfLoading;
  const isOwner = !!me?.id && !!performance && performance.ownerId === me.id;
  const isManager =
    isOwner || (!!me?.id && !!performance?.managerIds && performance.managerIds.includes(me.id));

  return { isManager, isOwner, isLoading };
}
