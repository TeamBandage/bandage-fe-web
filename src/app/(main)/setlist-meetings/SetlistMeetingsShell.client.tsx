'use client';

import { PanelLeftOpen } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

import { SetlistMeetingsListPane } from './SetlistMeetingsListPane.client';

/**
 * 선곡 회의 영역 셸.
 * - 좌측 회의 목록 패널은 기본 접힘. 토글 버튼 클릭 시 메인 위로 오버레이.
 * - 회의 선택(=pathname 변경) 시 자동 닫힘. backdrop 클릭 / Esc 도 닫힘.
 * - 1280px 환경에서 가운데 차트 공간을 최대로 확보하는 것이 목적.
 */
export function SetlistMeetingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  // '?listOpen=1' 진입 시 좌측 마스터 패널 자동 펼침 ('나의 선곡 회의' 서브탭).
  const initialListOpen = searchParams?.get('listOpen') === '1';
  const [listOpen, setListOpen] = useState(initialListOpen);

  // 경로 변경 시 자동 닫기. 단, '?listOpen=1' 로 진입한 첫 마운트는 펼침 유지.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setListOpen(false);
  }, [pathname]);

  // Esc 닫기.
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
      {/* 좌측 토글 — lg 이상에서만 노출 (모바일은 BottomNav). */}
      <button
        type="button"
        onClick={() => setListOpen((v) => !v)}
        aria-expanded={listOpen}
        aria-label="회의 목록 열기/닫기"
        className="bg-surface border-border text-foreground-sub hover:bg-card hover:text-foreground top-s-3 left-s-3 absolute z-30 hidden h-8 w-8 items-center justify-center rounded-md border shadow-sm transition-colors lg:inline-flex"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>

      {/* Backdrop — open 일 때만. */}
      {listOpen && (
        <div
          aria-hidden="true"
          onClick={() => setListOpen(false)}
          className="bg-bg/40 absolute inset-0 z-20 backdrop-blur-sm lg:block"
        />
      )}

      {/* 회의 목록 패널 — 오버레이로 absolute. */}
      <Suspense fallback={null}>
        <SetlistMeetingsListPane
          open={listOpen}
          onClose={() => setListOpen(false)}
          mode="overlay"
        />
      </Suspense>

      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
