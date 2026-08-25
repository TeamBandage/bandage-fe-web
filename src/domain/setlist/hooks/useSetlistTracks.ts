import { queryKeys } from '@/global/config/queryKeys';
import { useIsAuthenticated } from '@/global/store/authStore';
import { useInfiniteCursor } from '@/hooks/useInfiniteCursor';

import { getSetlistTracks } from '../api';
import type { SetlistTrackResponse } from '../types/res';

/** pageSize를 쿼리 키에 포함시켜, 같은 setlistId라도 용도가 다른 호출(트랙 탭의 스크롤 페이징 vs
 * 시간표 탭의 전체 로드)이 서로의 페이지네이션 상태를 침범하지 않고 독립적으로 캐싱되게 한다. */
export function useSetlistTracks(setlistId: string, pageSize: number = 20) {
  const authenticated = useIsAuthenticated();
  return useInfiniteCursor<SetlistTrackResponse, string>(
    [...queryKeys.setlist.tracks(setlistId), pageSize],
    ({ lastId, pageSize: size }) => getSetlistTracks(setlistId, { lastId, pageSize: size }),
    pageSize,
    { enabled: authenticated && Boolean(setlistId) },
  );
}
