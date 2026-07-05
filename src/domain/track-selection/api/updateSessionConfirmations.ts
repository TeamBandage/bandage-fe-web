import { apiClient } from '@/global/api/apiClient';

type Body = { confirm: number[]; unconfirm: number[] };

export async function updateSessionConfirmations(
  selectionId: string,
  itemId: string,
  sessionId: string,
  body: Body,
): Promise<void> {
  await apiClient.patch<null>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/sessions/${sessionId}/confirmations`,
    body,
  );
}
