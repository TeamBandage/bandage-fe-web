'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withdraw } from '../api/withdraw';

type UseWithdrawOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useWithdraw(options?: UseWithdrawOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: withdraw,
    onSuccess: () => {
      queryClient.clear();
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
