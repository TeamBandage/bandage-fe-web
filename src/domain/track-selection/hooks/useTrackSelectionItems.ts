import { useIsAuthenticated } from '@/global/store/authStore';
import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getTrackSelectionItems } from '../api/getTrackSelectionItems';
import type { TrackSelectionItemResponse } from '../types/res';
import type { TrackSelectionItemsFilter } from '../types/req';

export function useTrackSelectionItems(
  selectionId: string,
  pageSize = 50,
  filter?: TrackSelectionItemsFilter,
) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<TrackSelectionItemResponse, string>(
    queryKeys.trackSelection.items(selectionId, filter),
    ({ lastId, pageSize: size }) =>
      getTrackSelectionItems(selectionId, { lastId, pageSize: size, ...filter }),
    pageSize,
    { enabled: authenticated && Boolean(selectionId) },
  );
}
