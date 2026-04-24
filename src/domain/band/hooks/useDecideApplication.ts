'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { decideApplication } from '../api/decideApplication';
import type { BandApplicationDecision } from '../types';

type UseDecideApplicationOptions = {
  onSuccess?: (vars: { applicationId: string; decision: BandApplicationDecision }) => void;
  onError?: (error: Error) => void;
};

type Variables = {
  applicationId: string;
  decision: BandApplicationDecision;
};

export function useDecideApplication(bandId: string, options?: UseDecideApplicationOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Variables>({
    mutationFn: ({ applicationId, decision }) => decideApplication(bandId, applicationId, decision),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.applications(bandId)] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.members(bandId)] });
      options?.onSuccess?.(variables);
    },
    onError: options?.onError,
  });
}
