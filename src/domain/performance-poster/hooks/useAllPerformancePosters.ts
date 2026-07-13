import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getPerformancePosters } from '../api';

export function useAllPerformancePosters() {
  return useQuery({
    queryKey: queryKeys.performancePoster.listAll(),
    queryFn: () => getPerformancePosters(),
  });
}
