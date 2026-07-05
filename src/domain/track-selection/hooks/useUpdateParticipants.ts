import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateParticipants, type UpdateParticipantsRequest } from '../api/updateParticipants';

export function useUpdateParticipants(selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateParticipantsRequest) => updateParticipants(selectionId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.trackSelection.detail(selectionId) });
    },
  });
}
