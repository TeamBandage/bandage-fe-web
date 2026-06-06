'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { updateMyAvailability } from '../api/updateMyAvailability';
import type { MemberAvailabilityResponse, UpdateMyAvailabilityRequest } from '../types';

type UseUpdateMyAvailabilityOptions = {
  onSuccess?: (data: MemberAvailabilityResponse) => void;
  onError?: (error: Error) => void;
};

export function useUpdateMyAvailability(options?: UseUpdateMyAvailabilityOptions) {
  const queryClient = useQueryClient();
  return useMutation<MemberAvailabilityResponse, Error, UpdateMyAvailabilityRequest>({
    mutationFn: updateMyAvailability,
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.member.myAvailability], data);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
