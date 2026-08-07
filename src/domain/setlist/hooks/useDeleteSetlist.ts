import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteSetlist } from '../api';

export function useDeleteSetlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setlistId: string) => deleteSetlist(setlistId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.setlist.all });
    },
  });
}
