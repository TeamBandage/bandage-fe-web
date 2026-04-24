'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logout } from '../api/logout';

type UseLogoutOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useLogout(options?: UseLogoutOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
