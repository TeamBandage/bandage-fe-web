'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { upsertRefLink } from '../api/upsertRefLink';
import { queryKeys } from '@/global/config/queryKeys';

type Options = {
  practiceId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useUpsertSongRefLink(songId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (refLink) => upsertRefLink(songId, refLink),
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
