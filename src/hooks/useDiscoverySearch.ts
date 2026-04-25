'use client';

import { useMemo, useState } from 'react';

/**
 * Discovery 검색을 위한 클라이언트 사이드 hook.
 * 백엔드에 검색 query 파라미터가 추가되기 전까지의 stop-gap.
 *
 * @param items 전체 페치된 항목들 (useInfiniteCursor 의 모든 페이지를 flat 한 결과)
 * @param accessor 검색 대상 텍스트를 추출하는 함수 (다중 필드 OR 매칭은 string 합치기로 표현)
 *
 * 사용 예:
 *   const { query, setQuery, filtered } = useDiscoverySearch(bands, (b) => `${b.bandName} ${b.description ?? ''}`);
 *
 * 백엔드 q 쿼리 도입 시: 이 hook 호출부를 `useBandList(q)` 로 교체하고 filtered 대신 data 사용.
 */
export function useDiscoverySearch<T>(items: readonly T[], accessor: (item: T) => string) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const tokens = q.split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const haystack = accessor(item).toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [items, accessor, query]);

  return { query, setQuery, filtered, isFiltering: query.trim().length > 0 };
}
