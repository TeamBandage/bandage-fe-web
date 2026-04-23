import { cn } from '@/lib/cn';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
};

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]',
};

export function Spinner({ size = 'md', className, label = '로딩 중' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'border-border-hi border-t-accent rounded-pill inline-block animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );
}
