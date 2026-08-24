import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/global/config/queryKeys';

import { getSlotAvailabilities } from '../api';

/** 화면에 보이는 주(from~to) 단위로 벌크 조회해 캐싱 — 슬롯 호버링 시 추가 호출 없이 표시하는 용도.
 * from/to 는 호출부에서 최대 31일 이내로 넘겨야 한다. */
export function useSlotAvailabilities(setlistId: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.setlist.slotAvailabilities(setlistId, from, to),
    queryFn: () => getSlotAvailabilities(setlistId, { from, to }),
    enabled: Boolean(setlistId && from && to),
  });
}
