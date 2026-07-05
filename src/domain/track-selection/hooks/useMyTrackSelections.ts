'use client';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getMyTrackSelections } from '../api/getMyTrackSelections';
import type { TrackSelectionResponse } from '../types/res';

export function useMyTrackSelections(pageSize: number = 20) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<TrackSelectionResponse, string>(
    queryKeys.trackSelection.my(),
    ({ lastId, pageSize: size }) => getMyTrackSelections({ lastId, pageSize: size }),
    pageSize,
    { enabled: authenticated },
  );
}
