'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteMyProfileImage } from '../api/deleteMyProfileImage';
import type { MemberInfoResponse } from '../types';

type UseDeleteMyProfileImageOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteMyProfileImage(options?: UseDeleteMyProfileImageOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: deleteMyProfileImage,
    onMutate: () => {
      const key = [...queryKeys.member.me];
      const prev = queryClient.getQueryData<MemberInfoResponse | null>(key);
      if (prev) {
        queryClient.setQueryData<MemberInfoResponse>(key, { ...prev, profileImg: null });
      }
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.member.me] });
      options?.onSuccess?.();
    },
    onError: (_err, _v, context) => {
      const ctx = context as { prev?: MemberInfoResponse | null } | undefined;
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData([...queryKeys.member.me], ctx.prev);
      }
      options?.onError?.(_err);
    },
  });
}
