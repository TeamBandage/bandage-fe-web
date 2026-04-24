'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteRefLink } from '../api/deleteRefLink';
import { queryKeys } from '@/global/config/queryKeys';

type Options = {
  practiceId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useDeleteSongRefLink(songId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteRefLink(songId),
    onSuccess: () => {
      if (options?.practiceId) {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.practice.detail(options.practiceId)],
        });
      }
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
