import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function Divider({ inset = false, className, ...props }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('bg-border h-px w-full', inset && 'mx-s-4', className)}
      data-slot="divider"
      {...props}
    />
  );
}
