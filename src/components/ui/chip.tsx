import { type HTMLAttributes } from 'react';

import type { SessionType } from '@/global/types';
import { cn } from '@/lib/cn';
import { getSessionTypeClasses } from '@/lib/session-type';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  interactive?: boolean;
  selected?: boolean;
  session?: SessionType;
}

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
          ? cn(getSessionTypeClasses(session), 'border-transparent')
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
