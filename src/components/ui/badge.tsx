import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warn' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-card-hover text-foreground-sub border border-border',
  accent: 'bg-accent-dim text-accent-hi',
  success: 'bg-success-dim text-success',
  warn: 'bg-warn-dim text-warn',
  danger: 'bg-danger-dim text-danger',
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
