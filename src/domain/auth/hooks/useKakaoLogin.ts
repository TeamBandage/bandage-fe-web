'use client';

import { useMutation } from '@tanstack/react-query';

import { kakaoLogin } from '../api/kakaoLogin';
import type { KakaoLoginRequest, OAuthLoginResponse } from '../types';

type Options = {
  onSuccess?: (data: OAuthLoginResponse) => void;
  onError?: (error: Error) => void;
};

export function useKakaoLogin(options?: Options) {
  return useMutation<OAuthLoginResponse, Error, KakaoLoginRequest>({
    mutationFn: kakaoLogin,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
