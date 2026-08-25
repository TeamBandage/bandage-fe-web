import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformancePosters } from '../api';

/** 특정 공연의 포스터 — 공연 하나당 보통 소수라 더보기 UI 없이 넉넉한 페이지 크기로 한 번에 받는다. */
export function usePerformancePosters(performanceId: string) {
  return useQuery({
    queryKey: queryKeys.performancePoster.list(performanceId),
    queryFn: async () => (await getPerformancePosters({ performanceId, pageSize: 100 })).content,
    enabled: !!performanceId,
  });
}
