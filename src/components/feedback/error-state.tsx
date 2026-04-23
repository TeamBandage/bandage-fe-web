import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해 주세요.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="text-danger h-10 w-10" aria-hidden="true" />
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
