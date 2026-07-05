import { useQuery } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/global/store/authStore';
import { queryKeys } from '@/global/config/queryKeys';

import { getChatMessages } from '../api/getChatMessages';

export function useChatMessages(selectionId: string, itemId: string) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.trackSelection.chat(selectionId, itemId),
    queryFn: () => getChatMessages(selectionId, itemId, { pageSize: 100 }),
    enabled: authenticated && Boolean(selectionId) && Boolean(itemId),
    refetchInterval: 5000,
  });
}
