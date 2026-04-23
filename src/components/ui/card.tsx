import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

import { cn } from '@/lib/cn';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  interactive?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { header, footer, padding = 'md', interactive, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card border-border flex flex-col overflow-hidden rounded-md border',
        interactive && 'hover:bg-card-hover cursor-pointer transition-colors',
        className,
      )}
      {...props}
    >
      {header && (
        <div className="border-border border-b px-4 py-3 text-sm font-semibold">{header}</div>
      )}
      <div className={cn(paddingClasses[padding])}>{children}</div>
      {footer && (
        <div className="border-border text-foreground-sub border-t px-4 py-3 text-xs">{footer}</div>
      )}
    </div>
  );
});
