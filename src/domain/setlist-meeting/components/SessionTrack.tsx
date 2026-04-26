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
  onClick: () => void;
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
  onClick,
}: SessionTrackProps) {
  const state = sessionState(confirmed, session.need);
  const tone = mine ? 'mine' : state;
  const ratio = Math.min(1, confirmed.length / Math.max(session.need, 1));

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${session.label} 확정 ${confirmed.length}/${session.need} · 지원 ${applicants.length}명${session.custom ? ' · 커스텀' : ''}${mine ? ' · 내가 지원함' : ''}`}
      className={cn(
        'inline-flex min-w-[30px] flex-col items-stretch gap-1 rounded-sm bg-transparent p-0.5 transition-colors',
        active && 'ring-accent ring-1 ring-offset-2',
      )}
    >
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
    </button>
  );
}
