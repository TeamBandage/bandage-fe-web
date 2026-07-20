'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export interface RightSlidePanelProps {
  open: boolean;
  /** CSS width 값. 예: 'max(780px, calc(100vw - 560px))'. */
  width: string;
  children: ReactNode;
  className?: string;
}

/**
 * 화면 우측에서 슬라이드 인/아웃되는 고정 패널.
 * document.body 에 포탈로 렌더 — 조상 요소의 overflow/스택 컨텍스트에 영향받지 않고
 * 뷰포트 우측 끝에 항상 붙는다.
 */
export function RightSlidePanel({ open, width, children, className }: RightSlidePanelProps) {
  const [mounted, setMounted] = useState(false);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // rAF 1번만으로는 마운트와 같은 프레임에 배치돼 transition 이 생략될 수 있어
      // 2번 중첩해 최초 translate-x-full 상태가 실제로 한 번 페인트된 뒤에 슬라이드 인.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setSlideIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setSlideIn(false);
    const unmount = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(unmount);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <aside
      data-slot="right-slide-panel"
      aria-hidden={!slideIn}
      className={cn(
        'fixed top-14 right-0 bottom-0 z-20 hidden shadow-lg transition-transform duration-200 ease-out lg:flex',
        slideIn ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        className,
      )}
      style={{ width }}
    >
      {children}
    </aside>,
    document.body,
  );
}
