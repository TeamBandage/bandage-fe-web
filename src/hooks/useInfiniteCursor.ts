import { useInfiniteQuery } from '@tanstack/react-query';

import type { CursorResponse } from '@/global/types';

type Fetcher<T, C> = (params: { lastId?: C; pageSize: number }) => Promise<CursorResponse<T, C>>;

export type InfiniteCursorOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
};

const DEFAULT_PAGE_SIZE = 10;

export function useInfiniteCursor<T, C>(
  queryKey: readonly unknown[],
  fetcher: Fetcher<T, C>,
  pageSize: number = DEFAULT_PAGE_SIZE,
  options?: InfiniteCursorOptions,
) {
  return useInfiniteQuery({
    queryKey: [...queryKey],
    queryFn: (ctx) => fetcher({ lastId: ctx.pageParam as C | undefined, pageSize }),
    getNextPageParam: (lastPage: CursorResponse<T, C>) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined as C | undefined,
    ...options,
  });
}
