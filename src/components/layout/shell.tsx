import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type ShellProps = HTMLAttributes<HTMLDivElement>;

export function Shell({ className, children, ...props }: ShellProps) {
  return (
    <div
      className={cn('flex h-screen w-screen overflow-hidden', className)}
      data-slot="shell"
      {...props}
    >
      {children}
    </div>
  );
}
