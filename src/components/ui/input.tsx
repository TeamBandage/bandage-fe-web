import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Field } from './field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

const baseInputClasses =
  'h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, id, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            baseInputClasses,
            'border-border hover:border-border-hi',
            className,
            error &&
              'border-danger hover:border-danger focus-visible:border-danger [&:not(:placeholder-shown)]:border-danger',
          )}
          {...props}
        />
      )}
    </Field>
  );
});
