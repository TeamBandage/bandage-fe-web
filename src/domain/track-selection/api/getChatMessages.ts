import { apiClient } from '@/global/api/apiClient';
import type { CursorResponse } from '@/global/types';

export interface ChatMemberInfo {
  memberId: number;
  name?: string;
  profileImg?: string;
}

export interface SetlistChatMessageResponse {
  messageId: string;
  trackSelectionItemId: string;
  /** @deprecated BE가 더 이상 필수로 내려주지 않음. member.memberId 를 사용할 것. */
  memberId?: number;
  member?: ChatMemberInfo;
  message: string;
  createdAt?: string;
}

export async function getChatMessages(
  selectionId: string,
  itemId: string,
  params?: { lastId?: string; pageSize?: number },
): Promise<CursorResponse<SetlistChatMessageResponse, string>> {
  return apiClient.get<CursorResponse<SetlistChatMessageResponse, string>>(
    `/api/v1/track-selections/${selectionId}/items/${itemId}/chat`,
    { query: params },
  );
}
