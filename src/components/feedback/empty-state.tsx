import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md text-center',
        compact ? 'py-4' : 'py-12',
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn('text-foreground-muted', compact ? 'h-6 w-6' : 'h-12 w-12')}
          aria-hidden="true"
        />
      )}
      <div className="space-y-1">
        <p className={cn('text-foreground font-medium', compact ? 'text-sm' : 'text-lg')}>
          {title}
        </p>
        {description && <p className="text-foreground-sub text-sm">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
