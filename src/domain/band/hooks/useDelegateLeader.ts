'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { delegateLeader } from '../api/delegateLeader';

type UseDelegateLeaderOptions = {
  onSuccess?: (bandMemberId: string) => void;
  onError?: (error: Error) => void;
};

export function useDelegateLeader(bandId: string, options?: UseDelegateLeaderOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (bandMemberId) => delegateLeader(bandId, bandMemberId),
    onSuccess: (_, bandMemberId) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.members(bandId)] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.detail(bandId)] });
      queryClient.invalidateQueries({ queryKey: queryKeys.band.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.band.list() });
      options?.onSuccess?.(bandMemberId);
    },
    onError: options?.onError,
  });
}
