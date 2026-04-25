import { Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = '서비스를 준비하고 있어요',
  description = '잠시 후 다시 시도하거나 다른 메뉴를 이용해 주세요.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md py-12 text-center',
        className,
      )}
    >
      <Wrench className="text-foreground-muted h-10 w-10" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-foreground text-lg font-medium">{title}</p>
        <p className="text-foreground-sub text-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
