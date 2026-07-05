import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSetlistTrack } from '../api';
import type { SetlistTrackUpdateRequest } from '../types/req';

export function useUpdateSetlistTrack(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, body }: { trackId: string; body: SetlistTrackUpdateRequest }) =>
      updateSetlistTrack(setlistId, trackId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.tracks(setlistId) });
    },
  });
}
