'use client';

import { useMutation } from '@tanstack/react-query';

import { googleLogin } from '../api/googleLogin';
import type { GoogleLoginRequest, OAuthLoginResponse } from '../types';

type Options = {
  onSuccess?: (data: OAuthLoginResponse) => void;
  onError?: (error: Error) => void;
};

export function useGoogleLogin(options?: Options) {
  return useMutation<OAuthLoginResponse, Error, GoogleLoginRequest>({
    mutationFn: googleLogin,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
