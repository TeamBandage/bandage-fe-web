'use client';

import { useCallback, useRef } from 'react';

type InfiniteScrollState = {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

/**
 * IntersectionObserver 기반 무한 스크롤 sentinel ref.
 *
 * Tabs 등에서 sentinel 요소가 마운트/언마운트를 반복하는 경우(비활성 탭은 언마운트되므로),
 * useEffect + useRef 조합은 관찰 대상이 늦게 마운트될 때 effect 의존성이 그 사이 변하지 않으면
 * observer 가 재부착되지 않는 문제가 있다. callback ref 는 노드가 (재)마운트될 때마다
 * 항상 새로 관찰을 시작하므로 이 문제가 없다.
 */
export function useInfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollState) {
  const stateRef = useRef<InfiniteScrollState>({ hasNextPage, isFetchingNextPage, fetchNextPage });
  stateRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };

  const observerRef = useRef<IntersectionObserver | null>(null);

  return useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      const current = stateRef.current;
      if (entries[0]?.isIntersecting && current.hasNextPage && !current.isFetchingNextPage) {
        current.fetchNextPage();
      }
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);
}
