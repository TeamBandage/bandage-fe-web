import { useIsAuthenticated } from '@/global/store/authStore';
import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getTrackSelectionItems } from '../api/getTrackSelectionItems';
import type { TrackSelectionItemResponse } from '../types/res';

export function useTrackSelectionItems(selectionId: string, pageSize = 50) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<TrackSelectionItemResponse, string>(
    queryKeys.trackSelection.items(selectionId),
    ({ lastId, pageSize: size }) => getTrackSelectionItems(selectionId, { lastId, pageSize: size }),
    pageSize,
    { enabled: authenticated && Boolean(selectionId) },
  );
}
