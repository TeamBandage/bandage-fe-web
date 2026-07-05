import { apiClient } from '@/global/api/apiClient';

import type { SetlistChatMessageResponse } from './getChatMessages';

export async function createChatMessage(
  selectionId: string,
  itemId: string,
  body: { message: string },
): Promise<SetlistChatMessageResponse> {
  return apiClient.post<SetlistChatMessageResponse>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/chat`,
    body,
  );
}
