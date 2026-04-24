import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent-outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-foreground hover:bg-accent-hi',
  secondary: 'bg-surface text-foreground border border-border hover:bg-card-hover',
  ghost: 'bg-transparent text-foreground hover:bg-card-hover',
  danger: 'bg-danger text-foreground hover:opacity-90',
  'accent-outline': 'bg-transparent text-accent border border-accent hover:bg-accent-dim',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    children,
    disabled,
    type,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;

  const content = asChild ? (
    children
  ) : (
    <>
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} label="로딩 중" />}
      {children}
    </>
  );

  return (
    <Comp
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      data-loading={loading ? '' : undefined}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {content}
    </Comp>
  );
});
