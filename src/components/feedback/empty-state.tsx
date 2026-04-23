import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md py-12 text-center',
        className,
      )}
    >
      {Icon && <Icon className="text-foreground-muted h-12 w-12" aria-hidden="true" />}
      <div className="space-y-1">
        <p className="text-foreground text-lg font-medium">{title}</p>
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
