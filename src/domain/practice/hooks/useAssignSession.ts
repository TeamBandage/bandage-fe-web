'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignSession } from '../api/assignSession';
import { queryKeys } from '@/global/config/queryKeys';
import { useAuthStore } from '@/global/store/authStore';

import type { PracticeDetailResponse } from '../types';

type Options = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Context = { previous?: PracticeDetailResponse | null };

/**
 * 본인을 세션에 배정합니다. (낙관적 업데이트)
 * NOTE: memberId 확보를 위해 별도 API 가 아닌 useAuthStore 에 저장된 값을 활용하지 않고,
 *   일단 낙관 업데이트에서는 participantId 를 알 수 없으므로 "placeholder 배정" 으로만 표시하고
 *   성공 시 invalidate 로 정확한 participantId 를 재조회합니다.
 */
export function useAssignSession(practiceId: string, options?: Options) {
  const queryClient = useQueryClient();
  const queryKey = [...queryKeys.practice.detail(practiceId)];

  return useMutation<void, Error, string, Context>({
    mutationFn: (sessionId) => assignSession(practiceId, sessionId),
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeDetailResponse | null>(queryKey);
      if (previous) {
        // 로컬 시각적 피드백용 임시 participant (실제 id 는 서버에서 확정)
        const placeholder = {
          participantId: '__pending__',
          memberId: Number(useAuthStore.getState().accessToken ? 0 : 0),
        };
        queryClient.setQueryData<PracticeDetailResponse>(queryKey, {
          ...previous,
          sessions: previous.sessions.map((s) =>
            s.sessionId === sessionId ? { ...s, participant: placeholder } : s,
          ),
        });
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      options?.onError?.(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => options?.onSuccess?.(),
  });
}
