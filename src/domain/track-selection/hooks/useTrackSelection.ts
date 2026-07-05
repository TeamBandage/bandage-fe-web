'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';

import { getTrackSelection } from '../api/getTrackSelection';
import type { TrackSelectionDetailResponse } from '../types/res';

export function useTrackSelection(selectionId: string) {
  const authenticated = useIsAuthenticated();
  return useQuery<TrackSelectionDetailResponse, Error>({
    queryKey: queryKeys.trackSelection.detail(selectionId),
    queryFn: () => getTrackSelection(selectionId),
    enabled: authenticated && Boolean(selectionId),
  });
}
