'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { removeBandMember } from '../api/removeBandMember';

type Options = {
  onSuccess?: (bandMemberId: string) => void;
  onError?: (error: Error) => void;
};

export function useRemoveBandMember(bandId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (bandMemberId) => removeBandMember(bandId, bandMemberId),
    onSuccess: (_, bandMemberId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.band.members(bandId) });
      options?.onSuccess?.(bandMemberId);
    },
    onError: options?.onError,
  });
}
