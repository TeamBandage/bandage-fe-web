'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { deleteMyProfileImage } from '../api/deleteMyProfileImage';

type UseDeleteMyProfileImageOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteMyProfileImage(options?: UseDeleteMyProfileImageOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: deleteMyProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.member.me] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
