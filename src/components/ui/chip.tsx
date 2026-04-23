import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import type { SessionType } from '@/global/types';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  interactive?: boolean;
  selected?: boolean;
  session?: SessionType;
}

const sessionClasses: Record<SessionType, string> = {
  VOCAL: 'bg-[oklch(0.62_0.22_250_/_0.18)] text-[oklch(0.82_0.12_250)]',
  CHORUS: 'bg-[oklch(0.62_0.22_290_/_0.18)] text-[oklch(0.82_0.12_290)]',
  GUITAR: 'bg-[oklch(0.62_0.22_40_/_0.18)] text-[oklch(0.82_0.12_40)]',
  BASS: 'bg-[oklch(0.62_0.22_10_/_0.18)] text-[oklch(0.82_0.12_10)]',
  DRUM: 'bg-[oklch(0.62_0.22_140_/_0.18)] text-[oklch(0.82_0.12_140)]',
  PERCUSSION: 'bg-[oklch(0.62_0.22_170_/_0.18)] text-[oklch(0.82_0.12_170)]',
  SYNTH: 'bg-[oklch(0.62_0.22_320_/_0.18)] text-[oklch(0.82_0.12_320)]',
  ETC: 'bg-card-hover text-foreground-sub',
};

export function Chip({
  interactive = false,
  selected = false,
  session,
  className,
  children,
  onClick,
  ...props
}: ChipProps) {
  const isButtonLike = interactive && typeof onClick === 'function';
  return (
    <span
      role={isButtonLike ? 'button' : undefined}
      tabIndex={isButtonLike ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={onClick}
      className={cn(
        'rounded-pill inline-flex items-center border px-2.5 py-1 text-xs font-medium transition-colors',
        session
          ? cn(sessionClasses[session], 'border-transparent')
          : 'bg-surface border-border text-foreground-sub',
        interactive &&
          'hover:border-border-hi focus-visible:ring-accent focus-visible:ring-offset-bg cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        selected && 'border-accent text-foreground ring-accent ring-1',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
