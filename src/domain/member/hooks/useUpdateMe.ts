'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateMe } from '../api/updateMe';
import type { MemberInfoResponse, UpdateMeRequest } from '../types';

type UseUpdateMeOptions = {
  onSuccess?: (data: MemberInfoResponse | null) => void;
  onError?: (error: Error) => void;
};

export function useUpdateMe(options?: UseUpdateMeOptions) {
  const queryClient = useQueryClient();
  return useMutation<MemberInfoResponse | null, Error, UpdateMeRequest>({
    mutationFn: updateMe,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.member.me] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
