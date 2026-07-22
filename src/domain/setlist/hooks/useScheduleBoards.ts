import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getScheduleBoards } from '../api';

export function useScheduleBoards(setlistId: string) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.setlist.scheduleBoards(setlistId),
    queryFn: () => getScheduleBoards(setlistId),
    enabled: authenticated && Boolean(setlistId),
  });
}
