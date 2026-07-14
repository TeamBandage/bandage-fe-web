'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateSessions } from '../api/updateSessions';
import type { JamSessionsUpdateRequest } from '../types/req';
import type { JamDetailResponse } from '../types/res';

type Options = {
  onSuccess?: (jam: JamDetailResponse) => void;
  onError?: (error: Error) => void;
};

export function useUpdateSessions(jamId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<JamDetailResponse, Error, JamSessionsUpdateRequest>({
    mutationFn: (body) => updateSessions(jamId, body),
    onSuccess: (jam) => {
      queryClient.setQueryData([...queryKeys.jam.detail(jamId)], jam);
      options?.onSuccess?.(jam);
    },
    onError: options?.onError,
  });
}
