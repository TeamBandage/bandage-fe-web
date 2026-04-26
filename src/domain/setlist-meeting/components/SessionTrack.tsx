'use client';

import { cn } from '@/lib/cn';

import type { SessionDef } from '../types';
import { sessionState } from '../utils';

export interface SessionTrackProps {
  session: SessionDef;
  applicants: string[];
  confirmed: string[];
  active: boolean;
  /** 현재 사용자가 지원했는지. */
  mine: boolean;
  /** 멤버 검색 매칭 — 빨간 점 표시. */
  highlighted?: boolean;
  /** 생략 시 비-인터랙티브 div 로 렌더(메인 행에서는 클릭 동작 없이 시각 표기만). */
  onClick?: () => void;
}

const labelTone: Record<'mine' | 'full' | 'partial' | 'empty', string> = {
  mine: 'text-accent underline underline-offset-2',
  full: 'text-success',
  partial: 'text-warn',
  empty: 'text-foreground-muted',
};

const fillTone: Record<'mine' | 'full' | 'partial' | 'empty', string> = {
  mine: 'bg-accent',
  full: 'bg-success',
  partial: 'bg-warn',
  empty: 'bg-transparent',
};

export function SessionTrack({
  session,
  applicants,
  confirmed,
  active,
  mine,
  highlighted = false,
  onClick,
}: SessionTrackProps) {
  const state = sessionState(confirmed, session.need);
  const tone = mine ? 'mine' : state;
  const ratio = Math.min(1, confirmed.length / Math.max(session.need, 1));

  const title = `${session.label} 확정 ${confirmed.length}/${session.need} · 지원 ${applicants.length}명${session.custom ? ' · 커스텀' : ''}${mine ? ' · 내가 지원함' : ''}`;

  const content = (
    <>
      {/* 멤버 검색 매칭 빨간 점 — 우상단 */}
      {highlighted && (
        <span
          aria-label="멤버 검색 매칭"
          className="bg-danger absolute top-0 right-0 h-1.5 w-1.5 rounded-full"
        />
      )}
      <span
        className={cn(
          'text-micro text-center font-mono leading-tight',
          mine ? 'font-extrabold' : 'font-bold',
          labelTone[tone],
        )}
      >
        {session.short}
        {session.custom && <span className="text-amber ml-0.5">*</span>}
      </span>
      <span className="bg-border relative block h-0.5 overflow-hidden rounded-[1px]">
        <span
          className={cn('absolute inset-y-0 left-0 transition-all', fillTone[tone])}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
    </>
  );

  const baseClass = cn(
    'relative inline-flex min-w-[30px] flex-col items-stretch gap-1 rounded-sm bg-transparent p-0.5 transition-colors',
    active && 'ring-accent ring-1 ring-offset-2',
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={baseClass}>
        {content}
      </button>
    );
  }

  // 비-인터랙티브: 메인 행에서는 표기만. 클릭은 row 의 onClick 으로 흘려보냄.
  return (
    <span title={title} className={baseClass} aria-hidden="false">
      {content}
    </span>
  );
}
