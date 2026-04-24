'use client';

import { useEffect, useState } from 'react';

/**
 * matchMedia 기반 반응형 훅.
 * SSR 안전: 초기값 false, 클라이언트 마운트 이후에 실제 상태로 갱신.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/** 960px 이상 = 데스크톱. globals.css 의 --breakpoint-lg 와 일치. */
export const useIsDesktop = () => useMediaQuery('(min-width: 960px)');
