import { useIsAuthenticated } from '@/global/store/authStore';
import { queryKeys } from '@/global/config/queryKeys';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getChatMessages, type SetlistChatMessageResponse } from '../api/getChatMessages';

export function useChatMessages(selectionId: string, itemId: string, pageSize: number = 30) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<SetlistChatMessageResponse, string>(
    queryKeys.trackSelection.chat(selectionId, itemId),
    ({ lastId, pageSize: size }) =>
      getChatMessages(selectionId, itemId, { lastId, pageSize: size }),
    pageSize,
    {
      enabled: authenticated && Boolean(selectionId) && Boolean(itemId),
      refetchInterval: 5000,
    },
  );
}
