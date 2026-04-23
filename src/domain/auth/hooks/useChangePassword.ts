'use client';

import { useMutation } from '@tanstack/react-query';

import { changePassword } from '../api/changePassword';
import type { PasswordChangeRequest } from '../types';

type UseChangePasswordOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function useChangePassword(options?: UseChangePasswordOptions) {
  return useMutation<void, Error, PasswordChangeRequest>({
    mutationFn: changePassword,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
