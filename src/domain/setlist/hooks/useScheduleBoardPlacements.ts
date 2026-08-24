import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getScheduleBoardPlacements } from '../api';

export function useScheduleBoardPlacements(setlistId: string, boardId: string | null) {
  return useQuery({
    queryKey: queryKeys.setlist.scheduleBoardPlacements(setlistId, boardId ?? ''),
    queryFn: () => getScheduleBoardPlacements(setlistId, boardId!),
    enabled: Boolean(boardId),
  });
}
