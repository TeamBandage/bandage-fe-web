'use client';

// 신규 API 에서는 세션 단위 배정 대신 POST /jams/{id}/participants 를 사용합니다.
// useAddParticipant 를 대신 사용하세요.

export function useAssignSession(
  _jamId: string,
  _options?: { onSuccess?: () => void; onError?: (error: Error) => void },
) {
  return { mutate: (_sessionId: string) => {}, isPending: false as const };
}
