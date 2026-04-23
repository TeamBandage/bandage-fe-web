import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type PageTitleProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageTitle({ title, description, action, className }: PageTitleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="space-y-1">
        <h1 className="text-foreground text-xl font-bold">{title}</h1>
        {description && <p className="text-foreground-sub text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
