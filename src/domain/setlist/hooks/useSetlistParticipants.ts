import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getSetlistParticipants } from '../api';
import type { SetlistParticipantResponse } from '../types/res';

export function useSetlistParticipants(setlistId: string, pageSize: number = 20) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<SetlistParticipantResponse, number>(
    queryKeys.setlist.participants(setlistId),
    ({ lastId, pageSize: size }) => getSetlistParticipants(setlistId, { lastId, pageSize: size }),
    pageSize,
    { enabled: authenticated && Boolean(setlistId) },
  );
}
