import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getSetlist } from '../api';

export function useSetlist(setlistId: string) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.setlist.detail(setlistId),
    queryFn: () => getSetlist(setlistId),
    enabled: authenticated && Boolean(setlistId),
  });
}
