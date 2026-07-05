import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteSetlistTrack } from '../api';

export function useDeleteSetlistTrack(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => deleteSetlistTrack(setlistId, trackId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.tracks(setlistId) });
    },
  });
}
