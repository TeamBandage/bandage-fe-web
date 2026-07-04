import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getSetlistTracks } from '../api';

export function useSetlistTracks(setlistId: string) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.setlist.tracks(setlistId),
    queryFn: () => getSetlistTracks(setlistId),
    enabled: authenticated && Boolean(setlistId),
  });
}
