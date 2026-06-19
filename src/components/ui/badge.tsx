import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warn'
  | 'amber'
  | 'danger'
  | 'muted'
  | 'blue';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-card-hover text-foreground-sub border border-border',
  accent: 'bg-accent-dim text-accent-hi',
  success: 'bg-success-dim text-success',
  warn: 'bg-warn-dim text-warn',
  amber: 'bg-amber-dim text-amber',
  danger: 'bg-danger-dim text-danger',
  muted: 'bg-surface text-foreground-muted border border-transparent',
  blue: 'bg-blue-dim text-blue',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-pill inline-flex items-center px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
