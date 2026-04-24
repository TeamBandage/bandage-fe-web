import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface SectionTitleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  action?: ReactNode;
  as?: 'h2' | 'h3' | 'div';
}

export function SectionTitle({
  title,
  action,
  as: Heading = 'h2',
  className,
  ...props
}: SectionTitleProps) {
  return (
    <div
      className={cn('mb-s-3 gap-s-3 flex items-center justify-between', className)}
      data-slot="section-title"
      {...props}
    >
      <Heading className="text-foreground-muted text-micro font-bold tracking-wider uppercase">
        {title}
      </Heading>
      {action !== undefined && <div className="gap-s-2 flex items-center">{action}</div>}
    </div>
  );
}
