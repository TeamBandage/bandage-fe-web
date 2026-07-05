import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSetlist } from '../api';

export function useUpdateSetlist(setlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateSetlist(setlistId, { title }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.detail(setlistId) });
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.my() });
    },
  });
}
