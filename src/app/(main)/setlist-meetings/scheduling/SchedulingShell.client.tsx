'use client';

import { PanelLeftOpen } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

import { SchedulingListPane } from './SchedulingListPane.client';

/**
 * 합주 일정 조율 영역 셸 — 마스터(좌측 회의 목록 오버레이) + 디테일(우측 본문).
 * SetlistMeetingsShell 과 동일한 패턴이지만 scheduling 전용 ListPane 을 사용.
 */
export function SchedulingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const initialListOpen = searchParams?.get('listOpen') === '1';
  const [listOpen, setListOpen] = useState(initialListOpen);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setListOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!listOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setListOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listOpen]);

  return (
    <div className="relative flex h-full">
      <button
        type="button"
        onClick={() => setListOpen((v) => !v)}
        aria-expanded={listOpen}
        aria-label="조율 회의 목록 열기/닫기"
        className="bg-surface border-border text-foreground-sub hover:bg-card hover:text-foreground top-s-3 left-s-3 absolute z-30 hidden h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-colors lg:inline-flex"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>

      {listOpen && (
        <div
          aria-hidden="true"
          onClick={() => setListOpen(false)}
          className="bg-bg/40 absolute inset-0 z-20 backdrop-blur-sm lg:block"
        />
      )}

      <Suspense fallback={null}>
        <SchedulingListPane open={listOpen} onClose={() => setListOpen(false)} mode="overlay" />
      </Suspense>

      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
