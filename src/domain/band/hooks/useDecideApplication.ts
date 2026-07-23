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
      // status 를 지정하지 않은 3단계 prefix로 무효화 — PENDING/APPROVED/REJECTED 등
      // 모든 상태별 캐시된 목록을 다 잡기 위함 (status 지정 시 4번째 key 요소가 달라 매칭 안 됨).
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.all, bandId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.band.myApplication(bandId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.members(bandId)] });
      options?.onSuccess?.(variables);
    },
    onError: options?.onError,
  });
}
