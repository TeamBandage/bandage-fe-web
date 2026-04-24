'use client';

import { useMutation } from '@tanstack/react-query';

import { login } from '../api/login';
import type { LoginRequest, LoginResponse } from '../types';

type UseLoginOptions = {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
};

export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
